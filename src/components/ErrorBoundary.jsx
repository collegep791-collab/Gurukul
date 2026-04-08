import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface dark:bg-slate-950 flex items-center justify-center p-8 transition-colors">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-error-container dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-4xl text-error dark:text-red-400">error</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface dark:text-white mb-3 tracking-tight">Something went wrong</h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="bg-surface-container-low dark:bg-slate-900 rounded-2xl p-4 mb-8 text-left border border-outline-variant/10 dark:border-slate-800">
              <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-2">Error Details</p>
              <p className="text-xs text-error dark:text-red-400 font-mono break-all">{this.state.error?.message || 'Unknown error'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary dark:bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Refresh Page
              </button>
              <button
                onClick={() => { window.location.href = '/login'; }}
                className="flex-1 bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container-high dark:hover:bg-slate-700 transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
