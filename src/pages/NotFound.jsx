import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary-fixed/10 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-error-container/10 rounded-full blur-[180px]"></div>
      </div>

      <div className="text-center max-w-md">
        <div className="h-32 w-32 bg-surface-container-low dark:bg-slate-800 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-2xl">
          <span className="material-symbols-outlined text-7xl text-outline/30 dark:text-slate-600">explore_off</span>
        </div>
        <h1 className="text-7xl font-black text-on-surface dark:text-white tracking-tighter mb-4">404</h1>
        <p className="text-xl font-black text-on-surface-variant dark:text-slate-400 mb-2">Page Not Found</p>
        <p className="text-sm text-outline dark:text-slate-500 font-medium mb-10">The page you're looking for doesn't exist or has been moved.</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="bg-primary dark:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
