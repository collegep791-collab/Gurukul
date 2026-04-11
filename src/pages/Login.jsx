import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, googleLogin, user } = useData();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (user) {
      const dest = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Inject Google script
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy.apps.googleusercontent.com',
            callback: async (res) => {
              try {
                setLoading(true);
                await googleLogin(res.credential);
              } catch (err) {
                setError('Google Login failed');
                setLoading(false);
              }
            }
          });
          if (googleButtonRef.current) {
            window.google.accounts.id.renderButton(googleButtonRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with',
            });
          }
        }
      };
      document.body.appendChild(script);
    } else {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
        });
      }
    }
  }, [googleLogin, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password, role.toUpperCase());
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(name, email, password, role.toUpperCase());
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="bg-surface text-on-background min-h-screen flex items-center justify-center p-4 md:p-0 overflow-hidden relative">
      <div className="fixed -z-10 top-0 left-0 w-full h-full bg-surface">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-fixed/20 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-container/20 rounded-full blur-[150px]"></div>
      </div>

      <main className="w-full max-w-6xl min-h-[800px] flex overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl z-10">
        
        <section className="w-full md:w-1/2 flex flex-col p-8 md:p-16 overflow-y-auto">
          <header className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined" data-icon="school" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-primary">Gurukul</span>
            </div>
          </header>

          <div className="flex-grow max-w-md mx-auto w-full">
            <div className="bg-surface-container-low p-1 rounded-full flex mb-10">
              <button 
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-full transition-all ${mode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3 border border-error/10">
                <span className="material-symbols-outlined text-error" data-icon="error">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">
                {mode === 'login' ? 'Welcome back' : 'Create Account'}
              </h1>
              <p className="text-on-surface-variant text-sm">
                {mode === 'login' ? 'Please enter your details to access your learning portal.' : 'Sign up to start your learning journey.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'login' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">Institutional Role</label>
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
                        <div className="text-center py-2 px-3 rounded-lg border border-outline-variant peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant transition-all text-xs font-medium">
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg" data-icon="person">person</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface text-sm transition-all outline-none"
                      id="name"
                      required
                      type="text"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-outline" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg" data-icon="mail">mail</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface text-sm transition-all outline-none"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline" htmlFor="password">Security Key</label>
                  {mode === 'login' && <a className="text-xs font-semibold text-primary hover:underline cursor-not-allowed opacity-50" href="#">Forgot?</a>}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg" data-icon="lock">lock</span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface text-sm transition-all outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg" data-icon="visibility">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline" htmlFor="confirmPassword">Confirm Key</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg" data-icon="lock_reset">lock_reset</span>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface text-sm transition-all outline-none"
                      id="confirmPassword"
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                    />
                  </div>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-semibold shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-wait"
                type="submit"
              >
                <span>{mode === 'login' ? 'Sign in to Dashboard' : 'Create Account'}</span>
                {loading && <div className="animate-spin h-5 w-5 border-2 border-on-primary/30 border-t-on-primary rounded-full"></div>}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface-container-lowest px-4 text-outline font-medium tracking-widest">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-center w-full" ref={googleButtonRef}></div>
            </div>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-xs text-on-surface-variant">By signing in, you agree to our <a className="underline font-medium cursor-not-allowed opacity-50" href="#">Terms of Service</a> and <a className="underline font-medium cursor-not-allowed opacity-50" href="#">Privacy Policy</a>.</p>
          </footer>
        </section>

        <section className="hidden md:flex md:w-1/2 relative bg-primary overflow-hidden text-on-primary">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <div className="absolute top-0 right-0 w-96 h-96 bg-tertiary-fixed rounded-full blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-on-primary-fixed-variant rounded-full blur-[100px] -ml-40 -mb-40"></div>
          </div>

          <div className="relative w-full h-full flex flex-col items-center justify-center p-16 z-10">
            <div className="relative z-10 w-full aspect-video rounded-2xl overflow-hidden shadow-2xl mb-12 transform -rotate-2">
              <img alt="Academic Excellence" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQFsvzu7ieFUp5fGWcP7dy4PIabIpzanurSDYHae95HTs0oLvCUoe_nhQ-93PgOhY3HguVSCIUoJji5gd19s0jem41zB9S_e87B8fqt8TaX4gQwTe2s71_eaVLTKkY0UXK7KgDsLPaKSlg4q9YnoJndFAzkKCd3NBjdf7YvoZf-yaGIR9J-EHxxYqmEaxGOHG43yyiGmLwQpgSN-PdQKh6bWFarCcqQIkl6ao5cxM0hxEmp8--aKGI7Y8H4SBilJ1E_XTYP0SFNGw" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-on-primary bg-slate-300 bg-cover bg-center" style={{backgroundImage: "url('https://api.dicebear.com/9.x/notionists/svg?seed=Easton')"}}></div>
                  <div className="w-8 h-8 rounded-full border-2 border-on-primary bg-slate-400 bg-cover bg-center" style={{backgroundImage: "url('https://api.dicebear.com/9.x/notionists/svg?seed=Chase')"}}></div>
                  <div className="w-8 h-8 rounded-full border-2 border-on-primary bg-slate-500 bg-cover bg-center" style={{backgroundImage: "url('https://api.dicebear.com/9.x/notionists/svg?seed=Liam')"}}></div>
                </div>
                <span className="text-sm font-medium">+2k scholars active</span>
              </div>
            </div>

            <div className="relative z-10 space-y-4 text-center max-w-sm">
              <h2 className="text-4xl font-bold leading-tight">Elevate your academic journey.</h2>
              <p className="text-primary-fixed text-lg opacity-90">Gurukul combines ancient wisdom with modern technology to provide an unparalleled learning ecosystem.</p>
            </div>

            <div className="absolute bottom-16 right-16 flex flex-col gap-4">
              <div className="glass-effect p-4 rounded-2xl shadow-xl border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined" data-icon="trending_up">trending_up</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-primary tracking-widest leading-tight">Global Success</p>
                  <p className="text-lg font-bold text-on-surface leading-tight">98% Completion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6K-59FVcSLfm6Kr0R--QGx29WMd_wFgI0ANuuhZmYBAdzbK6KZwqkwjcI9zON1CGKNVrjP9ZQ0L9AHfYcri_oyElgp7S5iuH9I3dz2k_qCmc2aozJP3TsmYsY-l0lip_04VY6rVVasGb3PZ_lPOxH__Td-XU4tgTotY7Cdmc3WUngCkx7mg7jxzY9G2pxRQy9c1P1hZl49AFP36v4Xa2LMVB2vwN1hsI7R16s251n9RtYLma0lSqS8kpVUAS9zYi47VhSUBaTK2Q')"}}></div>
        </section>
      </main>
    </div>
  );
}
