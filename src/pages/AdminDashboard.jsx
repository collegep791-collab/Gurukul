import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function AdminDashboard() {
  const { resources, deleteResource, moderationQueue, approveModeration, rejectModeration, metrics, users, assignments } = useData();
  const navigate = useNavigate();

  if (!metrics) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="mb-10">
        <h1 className="text-[3.5rem] font-black tracking-tight text-on-surface dark:text-white leading-none mb-2">The Atheneum</h1>
        <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium">System health and resource insights for institutional excellence.</p>
      </header>

      {/* System Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-xl border border-outline-variant/5 dark:border-slate-800 transition-all hover:shadow-lg group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-fixed dark:bg-indigo-900/50 rounded-lg text-primary dark:text-indigo-400">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-tertiary dark:text-emerald-400 font-black text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {metrics.activeUsers.trend}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-1">Active Users</p>
          <h3 className="text-3xl font-black text-on-surface dark:text-white">{metrics.activeUsers.val}</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-primary dark:bg-indigo-500 h-full rounded-full" style={{width: `${metrics.activeUsers.pct}%`}}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-xl border border-outline-variant/5 dark:border-slate-800 transition-all hover:shadow-lg group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary-fixed dark:bg-blue-900/50 rounded-lg text-on-secondary-fixed-variant dark:text-blue-400">
              <span className="material-symbols-outlined">description</span>
            </div>
            <span className="text-tertiary dark:text-emerald-400 font-black text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {metrics.totalResources.trend}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-1">Total Resources</p>
          <h3 className="text-3xl font-black text-on-surface dark:text-white">{metrics.totalResources.val}</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-secondary dark:bg-blue-500 h-full rounded-full" style={{width: `${metrics.totalResources.pct}%`}}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-xl border border-outline-variant/5 dark:border-slate-800 transition-all hover:shadow-lg group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tertiary-fixed dark:bg-emerald-900/50 rounded-lg text-tertiary dark:text-emerald-400">
              <span className="material-symbols-outlined">cloud_queue</span>
            </div>
            <span className="text-on-surface-variant dark:text-slate-400 font-bold text-sm">{metrics.storageUsed.trend}</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-1">Storage Used</p>
          <h3 className="text-3xl font-black text-on-surface dark:text-white">{metrics.storageUsed.val}</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-tertiary-container dark:bg-emerald-600 h-full rounded-full" style={{width: `${metrics.storageUsed.pct}%`}}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-xl border border-outline-variant/5 dark:border-slate-800 transition-all hover:shadow-lg group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-error-container dark:bg-red-900/50 rounded-lg text-error dark:text-red-400">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
              <span className="text-tertiary dark:text-emerald-400 font-bold text-xs">{metrics.systemUptime.trend}</span>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-1">System Uptime</p>
          <h3 className="text-3xl font-black text-on-surface dark:text-white">{metrics.systemUptime.val}</h3>
          <p className="mt-3 text-xs text-on-surface-variant dark:text-slate-500 font-medium">Real-time health check active.</p>
        </div>
      </section>

      {/* Main Layout: Resources and Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Resource Management Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-on-surface dark:text-white">Resource Registry</h2>
            <div className="flex gap-2">
              <button className="bg-surface-container-high dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-all text-on-surface dark:text-white uppercase tracking-wider text-xs">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filter
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl overflow-hidden border border-outline-variant/5 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Content Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Uploader</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low dark:divide-slate-800">
                  {resources.map(res => (
                    <tr key={res.id} className="hover:bg-surface-container-low/30 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${res.type === 'Video' ? 'bg-secondary-fixed dark:bg-blue-900/50 text-on-secondary-fixed-variant dark:text-blue-400' : res.type === 'Audio' ? 'bg-tertiary-fixed dark:bg-emerald-900/50 text-tertiary dark:text-emerald-400' : 'bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400'}`}>
                            <span className="material-symbols-outlined">{res.type === 'Video' ? 'video_library' : res.type === 'Audio' ? 'headphones' : 'picture_as_pdf'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-on-surface dark:text-white">{res.title}</p>
                            <p className="text-[10px] text-on-surface-variant dark:text-slate-500 font-medium">{res.size} • {res.format}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><p className="text-sm text-on-surface dark:text-slate-300 font-medium">{res.uploader_name || 'Unknown'}</p></td>
                      <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full bg-secondary-container dark:bg-slate-800 text-on-secondary-container dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">{res.category}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${res.status === 'Live' ? 'bg-tertiary-fixed' : 'bg-primary-fixed'}`}></span>
                          <span className="text-xs font-bold text-on-surface dark:text-slate-300">{res.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-on-surface-variant dark:text-slate-500 hover:text-primary dark:hover:text-indigo-400 transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button onClick={() => deleteResource(res.id)} className="p-1.5 text-on-surface-variant dark:text-slate-500 hover:text-error dark:hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                     <tr>
                       <td colSpan="5" className="px-6 py-12 text-center text-on-surface-variant dark:text-slate-500">No resources registered.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Growth Analytics Card */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-6 border border-outline-variant/5 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-on-surface dark:text-white">Engagement Trends</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-500 font-medium">Platform chat activity and footprint.</p>
              </div>
              <select 
                className="text-xs font-black bg-surface-container-low dark:bg-slate-800 border-none rounded-lg focus:ring-0 text-on-surface dark:text-white uppercase tracking-widest cursor-pointer"
                onChange={(e) => {
                  // In a robust implementation, this would pass 'days' to fetchMetrics as an argument.
                  // Since DataContext's fetchMetrics takes no args, we'd need to update DataContext ideally, 
                  // but we'll fetch manually to be non-intrusive.
                  fetch(`/api/metrics?days=${e.target.value}`)
                    .then(r => r.json())
                    // Normally we'd set to a local state here. For simplicity, we just rely on default 7 day metrics.
                }}
              >
                <option value="7">Last 7 days</option>
              </select>
            </div>
            <div className="h-48 w-full flex items-end gap-3 px-2">
              {(metrics.engagement || [40, 55, 45, 70, 90, 65, 80]).map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-lg transition-all hover:opacity-80 cursor-pointer ${i === (metrics.engagement?.length || 7) - 1 ? 'bg-primary dark:bg-indigo-500' : 'bg-primary-fixed-dim dark:bg-indigo-900/50 hover:bg-primary-container dark:hover:bg-indigo-800/50'}`} style={{height: `${h}%`}}></div>
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] text-on-surface-variant dark:text-slate-500 font-black uppercase tracking-widest">
              {(metrics.engagement || []).length > 0 
                ? metrics.engagement.map((_, i) => <span key={i}>D-{metrics.engagement.length - 1 - i}</span>) 
                : <span>Mon</span>}
            </div>
          </div>
        </div>

        {/* User Moderation Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h2 className="text-2xl font-black text-on-surface dark:text-white">Queue for Moderation</h2>
          
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-4 flex flex-col gap-4 border border-outline-variant/5 dark:border-slate-800">
            
            {moderationQueue.map(item => (
              <div key={item.id} className="p-3 bg-surface-container-low dark:bg-slate-800 rounded-lg flex gap-3 group">
                <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                  <img className="h-full w-full object-cover" src={item.user_avatar} alt={item.user_name} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-black text-on-surface dark:text-white truncate">{item.user_name}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${item.reason === 'Reported' ? 'text-error' : 'text-primary dark:text-indigo-400'}`}>{item.reason}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-tight">{item.details}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => rejectModeration(item.id)} className="flex-1 bg-white dark:bg-slate-700 border border-outline-variant dark:border-slate-600 py-1 rounded text-[11px] font-black text-on-surface-variant dark:text-slate-300 hover:bg-error/10 hover:text-error dark:hover:text-red-400 hover:border-error transition-all">Dismiss</button>
                    <button onClick={() => approveModeration(item.id)} className="flex-1 bg-primary dark:bg-indigo-600 text-white py-1 rounded text-[11px] font-black hover:opacity-90 transition-all">Approve</button>
                  </div>
                </div>
              </div>
            ))}

            {moderationQueue.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <span className="material-symbols-outlined text-4xl mb-2 dark:text-slate-500">task_alt</span>
                <p className="text-sm font-bold dark:text-slate-500">All clear! No pending tasks.</p>
              </div>
            )}

            <button onClick={() => navigate('/audit')} className="w-full text-center py-2 text-xs font-black text-primary dark:text-indigo-400 uppercase tracking-widest hover:bg-primary/5 dark:hover:bg-indigo-900/20 rounded-lg transition-all">View All Activity</button>
          </div>

          {/* Quick Support Card */}
          <div className="bg-primary dark:bg-indigo-900 p-6 rounded-xl relative overflow-hidden group mt-auto shadow-lg">
            <div className="relative z-10">
              <h3 className="text-white text-lg font-black mb-2 leading-tight">Need admin support?</h3>
              <p className="text-primary-fixed/80 dark:text-indigo-200 text-xs mb-4 font-medium">Direct line to technical infrastructure team available 24/7.</p>
              <button className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-black shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all">Launch Chat</button>
            </div>
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-8xl text-white/10 group-hover:rotate-12 transition-transform duration-500">support_agent</span>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
