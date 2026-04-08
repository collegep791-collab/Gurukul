export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-error text-white shadow-xl shadow-error/20',
    primary: 'bg-primary text-white shadow-xl shadow-primary/20',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>

      {/* Dialog */}
      <div className="relative bg-surface-container-lowest dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-outline-variant/10 dark:border-slate-800 p-8">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-error-container dark:bg-red-900/30' : 'bg-primary-fixed dark:bg-indigo-900/50'}`}>
            <span className={`material-symbols-outlined text-3xl ${variant === 'danger' ? 'text-error dark:text-red-400' : 'text-primary dark:text-indigo-400'}`}>
              {variant === 'danger' ? 'warning' : 'help'}
            </span>
          </div>
          <h3 className="text-xl font-black text-on-surface dark:text-white mb-2 tracking-tight">{title}</h3>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 font-medium leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container-high dark:hover:bg-slate-700 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all ${variantStyles[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
