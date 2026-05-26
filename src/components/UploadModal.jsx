/**
 * UploadModal.jsx
 * 
 * Technical Component: Academic Resource Upload Modal
 * Description: Implements a dual-mode upload interface (file upload or URL mapping)
 * allowing users to add resources (Documents, Videos, Audios, or Images). Connects to form states,
 * extracts sizes/formats, and triggers parent resource ingestion.
 * 
 * Dependencies: React
 */
import { useState, useRef } from 'react';

export default function UploadModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Document');
  const [category, setCategory] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const FORMAT_MAP = { Document: 'PDF', Video: 'MP4', Audio: 'MP3', Image: 'PNG' };

  const reset = () => {
    setTitle(''); setType('Document'); setCategory('');
    setUrl(''); setFile(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (uploadMode === 'file' && !file) { setError('Please select a file to upload.'); return; }
    if (uploadMode === 'url' && !url) { setError('Please enter a URL.'); return; }

    setLoading(true);
    try {
      if (uploadMode === 'file') {
        // FormData upload — uses api.upload() in ResourceHub
        await onSubmit({ title, type, format: FORMAT_MAP[type], category }, file);
      } else {
        await onSubmit({
          title,
          type,
          format: FORMAT_MAP[type],
          size: 'External',
          category,
          thumbnail: url,
        }, null);
      }
      reset();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>

      {/* Modal */}
      <div className="relative bg-surface-container-lowest dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-outline-variant/10 dark:border-slate-800">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">Contribute Resource</h2>
            <button onClick={handleClose} className="p-2 text-outline dark:text-slate-500 hover:text-on-surface dark:hover:text-white transition-colors rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-800">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium">Share your research with the academic community.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Neural Network Architecture"
              className="w-full px-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm font-medium text-on-surface dark:text-white outline-none focus:border-primary transition-all"
              required
            />
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm font-bold text-on-surface dark:text-white outline-none focus:border-primary cursor-pointer">
                <option value="Document">Document</option>
                <option value="Video">Video</option>
                <option value="Audio">Audio</option>
                <option value="Image">Image</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm font-bold text-on-surface dark:text-white outline-none focus:border-primary cursor-pointer">
                <option value="">Select...</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Psychology">Psychology</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Ethics">Ethics</option>
                <option value="Liberal Arts">Liberal Arts</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          {/* Upload Mode Toggle */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Source</label>
            <div className="bg-surface-container-low dark:bg-slate-800 p-1 rounded-xl flex gap-1">
              {['file', 'url'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUploadMode(mode)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${uploadMode === mode ? 'bg-white dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm' : 'text-outline dark:text-slate-500 hover:text-on-surface dark:hover:text-white'}`}
                >
                  {mode === 'file' ? '📁 Upload File' : '🔗 External URL'}
                </button>
              ))}
            </div>
          </div>

          {/* File or URL input */}
          {uploadMode === 'file' ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">File</label>
              <div
                className="relative border-2 border-dashed border-outline-variant/30 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <span className="material-symbols-outlined text-3xl text-outline dark:text-slate-500 block mb-2">cloud_upload</span>
                <p className="text-sm font-bold text-on-surface dark:text-white">{file ? file.name : 'Click to select file'}</p>
                <p className="text-[10px] text-outline dark:text-slate-500 font-medium mt-1">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, MP4, MP3, PNG — up to 100MB'}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.mp4,.mp3,.png,.jpg,.jpeg,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Resource URL</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-slate-500 text-lg">link</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/10 dark:border-slate-700 rounded-xl text-sm font-medium text-on-surface dark:text-white outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-bold text-error bg-error-container dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={handleClose} className="flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title}
              className="flex-1 bg-primary text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>Uploading...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">publish</span>Contribute</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
