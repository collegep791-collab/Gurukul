/**
 * src/pages/Notes.jsx
 * 
 * Technical Component: Digital Notebook Interface
 * Description: A unified workspace for managing personal study notes and viewing
 * globally broadcasted course notes from faculty. Implements auto-saving forms and
 * a masonry/grid layout for note organization.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function Notes() {
  const { user, notes, createNote, updateNote, deleteNote, searchQuery, setSearchQuery } = useData();
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [view, setView] = useState('list');
  const autoSaveTimer = useRef(null);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const isReadOnly = activeNote && user && activeNote.user_id !== user.id;

  // Auto-save: debounce 1.5s after user stops typing
  const autoSave = useCallback(async () => {
    if (!activeNoteId || isReadOnly) return;
    setSaving(true);
    try {
      await updateNote(activeNoteId, { title: editTitle, content: editContent, category: editCategory });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }, [activeNoteId, editTitle, editContent, editCategory, updateNote, isReadOnly]);

  useEffect(() => {
    if (!activeNoteId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(), 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [editTitle, editContent, editCategory, autoSave, activeNoteId]);

  const handleSelectNote = (note) => {
    // Save current note before switching
    if (activeNoteId && autoSaveTimer.current && !isReadOnly) {
      clearTimeout(autoSaveTimer.current);
      autoSave();
    }
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setPreview(note.user_id !== user?.id); // auto-preview if read only
    setView('note');
  };

  const handleNewNote = async () => {
    if (user?.role === 'STUDENT') return;
    const note = await createNote({ title: 'Untitled Note', content: '', category: 'General' });
    handleSelectNote(note);
  };

  const handleDelete = async () => {
    if (!activeNoteId || isReadOnly) return;
    await deleteNote(activeNoteId);
    setActiveNoteId(null);
    setEditTitle('');
    setEditContent('');
    setView('list');
  };

  const downloadNote = () => {
    if (!activeNote) return;
    const element = document.createElement("a");
    const file = new Blob([activeNote.content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredNotes = notes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['General', 'Physics', 'Computer Science', 'Research', 'Philosophy', 'Mathematics', 'Psychology'];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-surface-container-lowest dark:bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 dark:border-slate-800">
        
        {/* Notes List Sidebar */}
        <aside className={`${view === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-surface-container-low dark:bg-slate-900/80 border-r border-outline-variant/10 dark:border-slate-800 flex-col flex-shrink-0`}>
          <div className="p-6 border-b border-outline-variant/10 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-on-surface dark:text-white tracking-tight">Notes</h2>
              {user?.role !== 'STUDENT' && (
                <button
                  onClick={handleNewNote}
                  className="h-9 w-9 bg-primary dark:bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              )}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-sm">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary transition-all dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {filteredNotes.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-outline/20 dark:text-slate-700 mb-4 block">edit_note</span>
                <p className="text-sm text-on-surface-variant dark:text-slate-500 font-bold">No notes yet</p>
                {user?.role !== 'STUDENT' && (
                  <p className="text-xs text-outline dark:text-slate-600 mt-1">Click + to create your first note</p>
                )}
              </div>
            )}
            
            {/* My Notes Section - hidden for students */}
            {user?.role !== 'STUDENT' && filteredNotes.filter(n => n.user_id === user?.id).length > 0 && (
              <>
                <p className="text-[9px] font-black text-outline dark:text-slate-600 uppercase tracking-[3px] px-2 pt-2 pb-1">My Notes</p>
                {filteredNotes.filter(n => n.user_id === user?.id).map(note => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`w-full text-left p-4 rounded-2xl transition-all group ${
                      activeNoteId === note.id
                        ? 'bg-white dark:bg-slate-800 shadow-lg shadow-surface-container-low/50 border border-primary/10 dark:border-primary/30'
                        : 'hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`text-sm font-black truncate max-w-[180px] ${activeNoteId === note.id ? 'text-primary dark:text-indigo-400' : 'text-on-surface dark:text-white'}`}>
                        {note.title}
                      </h4>
                      <span className="text-[9px] font-black text-outline dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {note.content || 'Empty note...'}
                    </p>
                    <span className="text-[9px] font-black text-primary/60 dark:text-indigo-400/40 uppercase tracking-widest">{note.category}</span>
                  </button>
                ))}
              </>
            )}

            {/* Shared Notes Section */}
            {filteredNotes.filter(n => n.user_id !== user?.id).length > 0 && (
              <>
                <div className="pt-3 mt-2 border-t border-outline-variant/10 dark:border-slate-800">
                  <p className="text-[9px] font-black text-tertiary dark:text-emerald-400 uppercase tracking-[3px] px-2 pt-1 pb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">school</span>
                    Shared by Teachers
                  </p>
                </div>
                {filteredNotes.filter(n => n.user_id !== user?.id).map(note => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`w-full text-left p-4 rounded-2xl transition-all group ${
                      activeNoteId === note.id
                        ? 'bg-white dark:bg-slate-800 shadow-lg shadow-surface-container-low/50 border border-tertiary/10 dark:border-emerald-500/30'
                        : 'hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`text-sm font-black truncate max-w-[180px] ${activeNoteId === note.id ? 'text-tertiary dark:text-emerald-400' : 'text-on-surface dark:text-white'}`}>
                        {note.title}
                      </h4>
                      <span className="text-[9px] font-black text-outline dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        {note.author_name}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {note.content || 'Empty note...'}
                    </p>
                    <span className="text-[9px] font-black text-tertiary/50 dark:text-emerald-400/40 uppercase tracking-widest">{note.category}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Editor Area */}
        <main className={`${view === 'note' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white dark:bg-slate-950 overflow-hidden`}>
          {activeNoteId ? (
            <>
              {/* Editor Toolbar */}
              <header className="h-16 border-b border-outline-variant/10 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={() => setView('list')} className="md:hidden p-2 text-outline hover:text-on-surface">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  {!isReadOnly ? (
                    <>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="bg-surface-container-low dark:bg-slate-800 text-xs font-black text-on-surface dark:text-white uppercase tracking-widest px-2 py-2 md:px-4 rounded-lg border-none outline-none cursor-pointer"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
  
                      {/* Edit / Preview Toggle */}
                      <div className="hidden md:flex bg-surface-container-low dark:bg-slate-800 p-0.5 rounded-lg">
                        <button
                          onClick={() => setPreview(false)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${!preview ? 'bg-white dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm' : 'text-outline dark:text-slate-500'}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPreview(true)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${preview ? 'bg-white dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm' : 'text-outline dark:text-slate-500'}`}
                        >
                          Preview
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="hidden md:inline-block px-3 py-1 bg-surface-container-low dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-400">
                        View Only
                      </span>
                      <span className="text-xs font-bold text-on-surface-variant dark:text-slate-500">Shared by {activeNote.author_name}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {!isReadOnly ? (
                    <>
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${saving ? 'text-primary dark:text-indigo-400' : saved ? 'text-tertiary-fixed' : 'text-outline dark:text-slate-600'}`}>
                        {saving ? '⟳ Saving...' : saved ? '✓ Saved' : 'Auto-save on'}
                      </span>
                      <button
                        onClick={handleDelete}
                        className="p-2 text-outline dark:text-slate-500 hover:text-error dark:hover:text-red-400 transition-colors rounded-lg"
                        title="Delete note"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={downloadNote}
                      className="flex items-center gap-2 bg-surface-container-high dark:bg-slate-800 text-on-surface dark:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
                      title="Download as Markdown"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download
                    </button>
                  )}
                </div>
              </header>

              {/* Title + Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 scrollbar-hide">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  readOnly={isReadOnly}
                  placeholder="Note title..."
                  className={`w-full text-3xl md:text-4xl font-black text-on-surface dark:text-white bg-transparent border-none outline-none mb-8 placeholder-outline/30 dark:placeholder-slate-700 tracking-tight ${isReadOnly ? 'pointer-events-none' : ''}`}
                />

                {preview ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-code:bg-surface-container-low prose-code:dark:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:dark:text-indigo-400 prose-code:font-bold prose-pre:bg-surface-container-low prose-pre:dark:bg-slate-800 prose-pre:rounded-xl prose-pre:border prose-pre:border-outline-variant/10 prose-pre:dark:border-slate-700">
                    <ReactMarkdown>{editContent || '*Start writing your thoughts...*'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing your thoughts... (Markdown supported: **bold**, # headings, - lists, ```code```)"
                    className="w-full min-h-[calc(100vh-400px)] text-sm font-medium text-on-surface-variant dark:text-slate-300 bg-transparent border-none outline-none resize-none leading-relaxed placeholder-outline/30 dark:placeholder-slate-700 font-mono"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-24 w-24 bg-surface-container-low dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <span className="material-symbols-outlined text-5xl text-outline/30 dark:text-slate-600">edit_note</span>
                </div>
                <h3 className="text-2xl font-black text-on-surface dark:text-white mb-3 tracking-tight">Select a Note</h3>
                <p className="text-sm text-on-surface-variant dark:text-slate-500 mb-8">Choose a note from the sidebar to view{user?.role !== 'STUDENT' && ' or create a new one'}.</p>
                {user?.role !== 'STUDENT' && (
                  <button
                    onClick={handleNewNote}
                    className="bg-primary dark:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Create Note
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
