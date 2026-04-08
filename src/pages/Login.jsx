import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useData();
  const [email, setEmail] = useState('aryan@gurukul.edu');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const dest = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      // DataContext will handle the user state update, which triggers the useEffect above
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="bg-surface dark:bg-slate-950 text-on-background dark:text-slate-100 min-h-screen flex items-center justify-center p-4 md:p-0 overflow-hidden transition-colors relative">
      {/* Visual Polish: Background Blobs for the Page */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-[150px]"></div>
      </div>

      {/* Auth Container: Two Pane Layout */}
      <main className="w-full max-w-6xl min-h-[800px] flex overflow-hidden rounded-xl bg-surface-container-lowest dark:bg-slate-900 shadow-2xl relative z-10 transition-colors">
        {/* Left Pane: Form Content */}
        <section className="w-full md:w-1/2 flex flex-col p-8 md:p-16 overflow-y-auto scrollbar-hide">
          {/* Header Identity */}
          <header className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-primary dark:text-indigo-400">Gurukul</span>
            </div>
          </header>

          <div className="flex-grow max-w-md mx-auto w-full flex flex-col justify-center">
            {/* Toggle Tab */}
            <div className="bg-surface-container-low dark:bg-slate-800 p-1 rounded-full flex mb-10 border border-outline-variant/10">
              <button className="flex-1 py-2 text-sm font-semibold rounded-full bg-surface-container-lowest dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm transition-all">Login</button>
              <button disabled className="flex-1 py-2 text-sm font-medium rounded-full text-on-surface-variant/40 dark:text-slate-500 cursor-not-allowed" title="Registration handled by institution">Register</button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 bg-error-container dark:bg-red-900/30 text-on-error-container dark:text-red-300 p-4 rounded-xl flex items-center gap-3 border border-error/10 animate-in fade-in slide-in-from-top-4">
                <span className="material-symbols-outlined text-error dark:text-red-400">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Identity Intro */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-on-surface dark:text-white tracking-tight mb-2">Welcome back</h1>
              <p className="text-on-surface-variant dark:text-slate-400 text-sm font-medium">Please enter your details to access your learning portal.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-outline dark:text-slate-500">Institutional Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['student', 'teacher', 'admin'].map((r) => (
                    <label key={r} className="cursor-pointer group">
                      <input
                        className="peer sr-only"
                        name="role"
                        type="radio"
                        value={r}
                        checked={role === r}
                        onChange={(e) => setRole(e.target.value)}
                      />
                      <div className="text-center py-2.5 px-3 rounded-xl border border-outline-variant/30 dark:border-slate-700 peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant dark:peer-checked:bg-primary/20 dark:peer-checked:text-indigo-400 transition-all text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 group-hover:bg-surface-container-low dark:group-hover:bg-slate-800">
                        {r}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-outline dark:text-slate-500" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-slate-500 text-lg">mail</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface dark:text-white text-sm font-medium transition-all outline-none"
                    id="email"
                    name="email"
                    placeholder="name@university.edu"
                    required
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-[2px] text-outline dark:text-slate-500" htmlFor="password">Security Key</label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline dark:text-slate-500 text-lg">lock</span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface dark:text-white text-sm font-medium transition-all outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 hover:text-on-surface dark:hover:text-white"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-primary dark:bg-indigo-600 text-on-primary py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group text-sm uppercase tracking-[3px] disabled:opacity-50"
                type="submit"
              >
                <span>{loading ? 'Authenticating...' : 'Sign in to Dashboard'}</span>
                {loading && <div className="animate-spin h-5 w-5 border-2 border-on-primary/30 border-t-on-primary rounded-full"></div>}
                {!loading && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30 dark:border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[4px]"><span className="bg-surface-container-lowest dark:bg-slate-900 px-4 text-outline dark:text-slate-500">Institutional SSO</span></div>
            </div>

            {/* SSO Section */}
            <div className="grid grid-cols-2 gap-4">
              <button disabled className="flex flex-col items-center justify-center gap-1 py-3 border border-outline-variant/20 dark:border-slate-800/50 rounded-xl cursor-not-allowed opacity-60">
                <div className="flex items-center gap-2">
                  <img alt="Google" className="w-4 h-4 grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKZU0VHs_zJzQWqLsF3c88EH220nnt1eaUuuWwLmdmU1b_NWe4vAVphAdGwnYQDGJXXzTn-5lU5GOSVMmbYMQq9DEBdnmkU1yW2HypO3cUARgpvrlBiW3CgK50wpcX77hsKm26EIeUi24o2RcrtRirHG_NzIbCfChxggriTNwkwHhK3uHGlDDTBiwmJbRCw8lUwrCASRmgA6AKuO96quYhDVmawRB48rQRssgU6TezP_LDLM84CwThJPQpq8Zp1yXBPKU3EXfKJew"/>
                  <span className="text-xs font-bold text-outline dark:text-slate-400 uppercase tracking-widest">Google</span>
                </div>
                <span className="text-[9px] font-black text-primary dark:text-indigo-400 uppercase">Coming soon</span>
              </button>
              <button disabled className="flex flex-col items-center justify-center gap-1 py-3 border border-outline-variant/20 dark:border-slate-800/50 rounded-xl cursor-not-allowed opacity-60">
                <div className="flex items-center gap-2">
                  <img alt="Microsoft" className="w-3.5 h-3.5 grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWEx8HHvoTKcg_v54-5_ekE6tZ-_GrjTiwruuh-vZEsz-L-Rtwjse0TsGu1sbRvSC0Vf6j7L0pN4HhcGHPbs-v2z0f3WA-uqudZA97Ay8Jtmg8kYoB5VVmvORY0aIsCwiRILoYDOl3aQZwgg9lqi-1RrylBe1yWkC9JjQ4G3RQKM9AbHs_iOfY9dDybP2u1GzI4SEGfSeIaHy0UfYlGm3mh4DZ_SA73PCxlrGyC-ZJGBhQQBerXFDqL-UP0LeLowBlIUiZzTbMO78"/>
                  <span className="text-xs font-bold text-outline dark:text-slate-400 uppercase tracking-widest">Azure</span>
                </div>
                <span className="text-[9px] font-black text-primary dark:text-indigo-400 uppercase">Coming soon</span>
              </button>
            </div>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-500 uppercase tracking-widest">
              Secured by Gurukul Academic Network Platform
            </p>
          </footer>
        </section>

        {/* Right Pane: Illustrative Content */}
        <section className="hidden md:flex md:w-1/2 relative bg-primary dark:bg-indigo-950 overflow-hidden transition-colors">
          {/* Decorative Background Element */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary-fixed rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-on-primary-fixed-variant rounded-full blur-[100px] -ml-40 -mb-40 animate-pulse delay-700"></div>
          </div>

          <div className="relative w-full h-full flex flex-col items-center justify-center p-16 text-on-primary z-10">
            {/* Featured Image Card */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] mb-12 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
              <img
                alt="Academic Excellence"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQFsvzu7ieFUp5fGWcP7dy4PIabIpzanurSDYHae95HTs0oLvCUoe_nhQ-93PgOhY3HguVSCIUoJji5gd19s0jem41zB9S_e87B8fqt8TaX4gQwTe2s71_eaVLTKkY0UXK7KgDsLPaKSlg4q9YnoJndFAzkKCd3NBjdf7YvoZf-yaGIR9J-EHxxYqmEaxGOHG43yyiGmLwQpgSN-PdQKh6bWFarCcqQIkl6ao5cxM0hxEmp8--aKGI7Y8H4SBilJ1E_XTYP0SFNGw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-8 h-8 rounded-full border-2 border-primary ring-2 ring-white/10 shadow-lg" alt="" />
                  ))}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white">+2k scholars active</span>
              </div>
            </div>

            <div className="space-y-6 text-center max-w-sm">
              <h2 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tighter text-white">Elevate your academic journey.</h2>
              <p className="text-primary-fixed dark:text-indigo-200 text-lg font-medium opacity-90 leading-relaxed">Gurukul combines ancient wisdom with modern technology to provide an unparalleled learning ecosystem.</p>
            </div>

            {/* Floating Stats Bento */}
            <div className="absolute bottom-16 right-16 flex flex-col gap-4">
              <div className="glass-effect p-6 rounded-[32px] shadow-2xl border border-white/20 flex items-center gap-5 translate-y-0 hover:-translate-y-2 transition-transform cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                  <span className="material-symbols-outlined font-variation-fill">trending_up</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-primary tracking-[2px] mb-1">Global Success</p>
                  <p className="text-xl font-black text-slate-900">98% Completion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Grain Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-125 brightness-110" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6K-59FVcSLfm6Kr0R--QGx29WMd_wFgI0ANuuhZmYBAdzbK6KZwqkwjcI9zON1CGKNVrjP9ZQ0L9AHfYcri_oyElgp7S5iuH9I3dz2k_qCmc2aozJP3TsmYsY-l0lip_04VY6rVVasGb3PZ_lPOxH__Td-XU4tgTotY7Cdmc3WUngCkx7mg7jxzY9G2pxRQy9c1P1hZl49AFP36v4Xa2LMVB2vwN1hsI7R16s251n9RtYLma0lSqS8kpVUAS9zYi47VhSUBaTK2Q')"}}></div>
        </section>
      </main>
    </div>
  );
}
