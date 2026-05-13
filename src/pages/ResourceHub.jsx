import { useState, useMemo, useCallback, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import UploadModal from '../components/UploadModal';
import { useData } from '../context/DataContext';

export default function ResourceHub() {
  const { user, resources, addResource, searchQuery, setSearchQuery, fetchResources } = useData();
  const [filter, setFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [isLoadingFilter, setIsLoadingFilter] = useState(false);

  // ─── Backend-filtered resources (via query params) ───
  const [filteredResources, setFilteredResources] = useState([]);

  // Fetch resources from backend with query params for type & search
  const fetchFiltered = useCallback(async (type, search) => {
    setIsLoadingFilter(true);
    try {
      const params = new URLSearchParams();
      if (type && type !== 'All') params.set('type', type);
      if (search) params.set('search', search);
      const qs = params.toString();
      const url = `/api/resources${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFilteredResources(data);
      }
    } catch {
      // Fallback to client-side filtering if the fetch fails
      setFilteredResources(resources.filter(r => {
        const matchesType = type === 'All' || !type || r.type === type;
        const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.category || '').toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }));
    }
    setIsLoadingFilter(false);
  }, [resources]);

  // Re-fetch when filter or search changes
  useEffect(() => {
    fetchFiltered(filter, searchQuery);
  }, [filter, searchQuery, fetchFiltered]);

  // Also sync when global resources change (e.g. after upload)
  useEffect(() => {
    setFilteredResources(prev => {
      // Only resync if we have no active filters, to avoid overwriting backend results
      if (filter === 'All' && !searchQuery) return resources;
      return prev;
    });
  }, [resources, filter, searchQuery]);

  // ─── Memoized category list extracted from resources ───
  const categories = useMemo(
    () => ['All', ...new Set(resources.map(r => r.category).filter(Boolean))],
    [resources]
  );

  // ─── Memoized sidebar category counts ───
  const categoryCounts = useMemo(() => {
    const counts = {};
    resources.forEach(r => {
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    });
    return counts;
  }, [resources]);

  // Category icon mapping
  const categoryIcons = {
    'Computer Science': 'code',
    'Physics': 'science',
    'Mathematics': 'calculate',
    'Ethics': 'gavel',
    'Liberal Arts': 'auto_stories',
    'Psychology': 'psychology',
    'Philosophy': 'self_improvement',
    'Literature': 'menu_book',
  };

  // ─── Category-aware thumbnail fallback (case-normalized) ───
  const getThumbnail = useCallback((res) => {
    if (res.thumbnail) return res.thumbnail;
    const cat = (res.category || '').toLowerCase();
    switch (cat) {
      case 'computer science': return 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80';
      case 'physics': return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80';
      case 'mathematics': return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80';
      case 'ethics': return 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
      case 'literature': return 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80';
      case 'psychology': return 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80';
      case 'philosophy': return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
      case 'liberal arts': return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80';
      default: return 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=600&q=80';
    }
  }, []);

  const featured = resources.find(r => r.featured) || resources[0];

  const handleContribute = async (resource, file) => {
    await addResource(resource, file);
    // Refresh after upload so the new resource appears
    fetchFiltered(filter, searchQuery);
  };

  const openResource = (res) => {
    if (res.file_path) {
      window.open(res.file_path.startsWith('http') ? res.file_path : `/uploads/${res.file_path}`, '_blank');
    } else if (res.thumbnail && res.thumbnail.startsWith('http')) {
      window.open(res.thumbnail, '_blank');
    }
  };

  // Skeleton loader for filter transitions
  const SkeletonCard = () => (
    <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl overflow-hidden border border-outline-variant/5 dark:border-slate-800 animate-pulse">
      <div className="aspect-video bg-surface-container-low dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-surface-container-low dark:bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-surface-container-low dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-surface-container-low dark:bg-slate-800 rounded w-1/2 mt-4" />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">Resource Hub</h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium">
              Explore our curated library of academic assets, interactive modules, and cutting-edge research.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="pl-10 pr-4 py-2.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all w-56 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            {user?.role !== 'STUDENT' && (
              <button
                onClick={() => setShowUpload(true)}
                className="bg-primary dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
                Contribute
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Featured & Filters Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        
        {/* Main Grid Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Featured Card */}
          {filter === 'All' && !searchQuery && featured && (
            <div
              onClick={() => openResource(featured)}
              className="relative h-[400px] rounded-3xl overflow-hidden group cursor-pointer shadow-2xl"
            >
              <img 
                src={getThumbnail(featured)} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                alt={featured.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                 <div className="glass-effect p-6 rounded-2xl border border-white/20 inline-block max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full mb-4 tracking-widest uppercase">Featured {featured.type}</span>
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-4 leading-tight">{featured.title}</h2>
                    <div className="flex items-center gap-6 text-white/80">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                        <span className="text-sm font-bold">{(featured.views ?? 0).toLocaleString()} Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span className="text-sm font-bold">{(featured.downloads ?? 0).toLocaleString()} Saved</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Filtering & Grid Control — accessible tablist */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-outline-variant/10 dark:border-slate-800">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide" role="tablist" aria-label="Filter resources by type">
              {['All', 'Video', 'Document', 'Audio', 'Image'].map(type => (
                <button 
                  key={type}
                  role="tab"
                  aria-selected={filter === type}
                  aria-controls="resource-grid"
                  onClick={() => setFilter(type)}
                  className={`px-5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap uppercase tracking-wider ${
                    filter === type 
                      ? 'bg-primary dark:bg-indigo-600 text-white shadow-md shadow-primary/20' 
                      : 'bg-surface-container-low dark:bg-slate-800 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">
                {isLoadingFilter ? '...' : `${filteredResources.length} Assets`}
              </p>
            </div>
          </div>

          {/* Resources Grid */}
          <div id="resource-grid" role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoadingFilter ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              filteredResources.map(res => (
              <div key={res.id} className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl overflow-hidden border border-outline-variant/5 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onClick={() => openResource(res)}>
                <div className="aspect-video relative bg-surface-container-low dark:bg-slate-800 overflow-hidden">
                  <img 
                    src={getThumbnail(res)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={res.title}
                  />
                  {res.type === 'Video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all">
                      <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white group-hover:scale-110 transition-all">
                         <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                      </div>
                    </div>
                  )}
                  {res.type === 'Audio' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                      <span className="material-symbols-outlined text-5xl text-primary/40">headphones</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest">{res.type} • {res.format}</span>
                    <span className="text-[10px] font-bold text-outline dark:text-slate-500">{res.size}</span>
                  </div>
                  <h4 className="font-black text-on-surface dark:text-white mb-2 line-clamp-2 min-h-[40px] text-sm">{res.title}</h4>
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-bold text-outline dark:text-slate-500">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">visibility</span>{(res.views ?? 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">download</span>{(res.downloads ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${res.verified ? 'bg-tertiary-fixed' : 'bg-primary-fixed'}`}></span>
                      <span className="text-[10px] font-black text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">{res.verified ? 'Verified' : 'Reviewing'}</span>
                    </div>
                    <span className="text-primary dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                      {res.type === 'Video' ? 'Watch' : 'Open'}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            )))}
          </div>

          {!isLoadingFilter && filteredResources.length === 0 && (
            <div className="py-24 text-center">
              <span className="material-symbols-outlined text-6xl text-outline/20 dark:text-slate-700 mb-4 block">search_off</span>
              <p className="text-on-surface-variant dark:text-slate-500 font-bold">No resources found matching your criteria.</p>
              <button onClick={() => { setFilter('All'); setSearchQuery(''); }} className="mt-4 text-primary dark:text-indigo-400 text-sm font-black uppercase tracking-widest">Clear Filters</button>
            </div>
          )}

        </div>

        {/* Categories Sidebar — dynamically generated from DB */}
        <aside className="space-y-8">
          <div className="bg-surface-container-low dark:bg-slate-900 p-6 rounded-2xl border border-outline-variant/5 dark:border-slate-800">
            <h3 className="text-lg font-black text-on-surface dark:text-white mb-6">Discovery</h3>
            <div className="space-y-4">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => { if (cat === 'All') { setFilter('All'); setSearchQuery(''); } else { setFilter('All'); setSearchQuery(cat); } }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-outline dark:text-slate-500 group-hover:text-primary dark:group-hover:text-indigo-400">{categoryIcons[cat] || 'library_books'}</span>
                    <span className="text-sm font-bold text-on-surface-variant dark:text-slate-400 group-hover:text-on-surface dark:group-hover:text-white">{cat === 'All' ? 'All Resources' : cat}</span>
                  </div>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-black text-primary dark:text-indigo-400 shadow-sm">
                    {cat === 'All' ? resources.length : (categoryCounts[cat] ?? 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {user?.role !== 'STUDENT' && (
            <div className="bg-primary dark:bg-indigo-900 p-8 rounded-3xl text-white relative overflow-hidden group shadow-xl">
               <div className="relative z-10">
                 <h3 className="text-2xl font-black mb-3 leading-tight">Join the Research Collective</h3>
                 <p className="text-primary-fixed/80 dark:text-indigo-200 text-sm mb-6">Contribute your findings and earn institutional credits.</p>
                 <button onClick={() => setShowUpload(true)} className="bg-white text-primary px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">Get Started</button>
               </div>
               <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[160px] text-white/10 group-hover:rotate-12 transition-transform duration-700">science</span>
            </div>
          )}
        </aside>

      </section>

      {/* Upload Modal */}
      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onSubmit={handleContribute} />
      
    </DashboardLayout>
  );
}
