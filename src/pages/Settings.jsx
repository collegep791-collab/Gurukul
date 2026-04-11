import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function Settings() {
  const { user, setUser } = useData();
  const { isDark, toggleDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const fileRef = useRef(null);

  // Security
  const [twoFactor, setTwoFactor] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  // Notifications
  const [notifyRes, setNotifyRes] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
    api.get('/settings').then(s => {
      setTwoFactor(!!s.two_factor);
      setNotifyRes(!!s.notify_resources);
      setNotifyMentions(!!s.notify_mentions);
      setNotifyUpdates(!!s.notify_updates);
    }).catch(() => {});
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    try {
      const updated = await api.patch('/users/me', { name, email });
      if (setUser) setUser(prev => ({ ...prev, name: updated.name, email: updated.email }));
      setProfileMsg('✓ Profile updated!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.message || 'Failed to save profile.');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProfileMsg('Uploading avatar...');
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/avatar', {
        method: 'PATCH',
        body: formData,
        // Don't set Content-Type, fetch handles multipart/form-data with boundaries automatically
      });
      if (!response.ok) throw new Error('Upload failed');
      const updated = await response.json();
      if (setUser) setUser(updated);
      setProfileMsg('✓ Avatar updated!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update avatar.');
    }
  };

  const handleChangePassword = async () => {
    setPwMsg('');
    if (!currentPw || !newPw) { setPwMsg('Please fill in all fields.'); return; }
    if (newPw.length < 6) { setPwMsg('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match.'); return; }
    try {
      await api.patch('/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg('✓ Password changed successfully!');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err) {
      setPwMsg(err.message || 'Failed to change password.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/settings', {
        theme: isDark ? 'dark' : 'light',
        two_factor: twoFactor ? 1 : 0,
        notify_resources: notifyRes ? 1 : 0,
        notify_mentions: notifyMentions ? 1 : 0,
        notify_updates: notifyUpdates ? 1 : 0,
      });
      setSaveMsg('Settings saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save.');
    }
  };

  if (!user) return null;

  const tabs = [
    { id: 'Profile', icon: 'person' },
    { id: 'Security', icon: 'shield_lock' },
    { id: 'Notifications', icon: 'notifications' },
    { id: 'Preferences', icon: 'tune' },
  ];

  return (
    <DashboardLayout>
      <div className="px-6 py-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-10">Settings</h1>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex flex-col gap-8">
            <nav className="flex flex-col gap-2 bg-surface-container-low dark:bg-slate-900 p-2 rounded-[32px] border border-outline-variant/5 dark:border-slate-800 shadow-sm">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-6 py-4 text-sm font-black rounded-2xl transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-primary shadow-xl' : 'text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                >
                  <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                  {tab.id}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col gap-8 w-full">

            {/* ─── PROFILE TAB ─── */}
            {activeTab === 'Profile' && (
              <section className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/10 dark:border-slate-800 rounded-[40px] p-10 shadow-xl space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface dark:text-white mb-1 tracking-tight">Public Identity</h2>
                  <p className="text-sm font-bold text-outline dark:text-slate-500 uppercase tracking-widest">Profile & Credentials</p>
                </div>

                <div className="flex items-center gap-10 p-8 bg-surface-container-low/40 dark:bg-slate-800/40 rounded-[32px]">
                  <div className="relative group">
                    <img className="w-28 h-28 rounded-[28px] object-cover ring-8 ring-white dark:ring-slate-900 shadow-2xl" src={user.avatar} alt={user.name} />
                    <input type="file" className="hidden" ref={fileRef} accept="image/*" onChange={handleAvatarUpload} />
                    <button onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 bg-primary text-white h-10 w-10 rounded-xl border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-on-surface dark:text-white mb-1">{user.name}</h4>
                    <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">{user.role} • Joined {user.date_joined}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px] ml-1">Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 bg-surface-container-low dark:bg-slate-800 border border-transparent rounded-2xl text-sm font-black text-on-surface dark:text-white focus:border-primary outline-none transition-all" type="text" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px] ml-1">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-surface-container-low dark:bg-slate-800 border border-transparent rounded-2xl text-sm font-black text-on-surface dark:text-white focus:border-primary outline-none transition-all" type="email" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                  {profileMsg && <span className={`text-sm font-bold ${profileMsg.startsWith('✓') ? 'text-tertiary dark:text-emerald-400' : 'text-error'}`}>{profileMsg}</span>}
                  <button onClick={handleSaveProfile} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                    Save Profile
                  </button>
                </div>
              </section>
            )}

            {/* ─── SECURITY TAB ─── */}
            {activeTab === 'Security' && (
              <section className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/10 dark:border-slate-800 rounded-[40px] p-10 shadow-xl space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface dark:text-white mb-1 tracking-tight">Security</h2>
                  <p className="text-sm font-bold text-outline dark:text-slate-500 uppercase tracking-widest">Account protection settings</p>
                </div>

                {/* Change Password */}
                <div className="space-y-5">
                  <h3 className="text-lg font-black text-on-surface dark:text-white">Change Password</h3>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px] ml-1">Current Password</label>
                    <input value={currentPw} onChange={e => setCurrentPw(e.target.value)} type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-surface-container-low dark:bg-slate-800 border border-transparent rounded-2xl text-sm font-black text-on-surface dark:text-white focus:border-primary outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px] ml-1">New Password</label>
                      <input value={newPw} onChange={e => setNewPw(e.target.value)} type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-surface-container-low dark:bg-slate-800 border border-transparent rounded-2xl text-sm font-black text-on-surface dark:text-white focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px] ml-1">Confirm New</label>
                      <input value={confirmPw} onChange={e => setConfirmPw(e.target.value)} type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-surface-container-low dark:bg-slate-800 border border-transparent rounded-2xl text-sm font-black text-on-surface dark:text-white focus:border-primary outline-none transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    {pwMsg && <span className={`text-sm font-bold ${pwMsg.startsWith('✓') ? 'text-tertiary dark:text-emerald-400' : 'text-error'}`}>{pwMsg}</span>}
                    <button onClick={handleChangePassword} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Two Factor */}
                <div className="pt-6 border-t border-outline-variant/10 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-on-surface dark:text-white mb-1">Two-Factor Authentication</h4>
                    <p className="text-[10px] font-bold text-outline dark:text-slate-500 uppercase tracking-wider">Enhanced account security</p>
                  </div>
                  <button onClick={() => setTwoFactor(!twoFactor)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${twoFactor ? 'bg-tertiary-fixed shadow-lg' : 'bg-surface-container-highest dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${twoFactor ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              </section>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === 'Notifications' && (
              <section className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/10 dark:border-slate-800 rounded-[40px] p-10 shadow-xl space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface dark:text-white mb-1 tracking-tight">Notifications</h2>
                  <p className="text-sm font-bold text-outline dark:text-slate-500 uppercase tracking-widest">Control what alerts you receive</p>
                </div>
                <div className="space-y-8">
                  {[
                    { id: 'New Resources', desc: 'When a teacher uploads new course material', state: notifyRes, setter: setNotifyRes },
                    { id: 'Chat Mentions', desc: 'When someone mentions you in a channel', state: notifyMentions, setter: setNotifyMentions },
                    { id: 'System Updates', desc: 'Platform announcements and policy changes', state: notifyUpdates, setter: setNotifyUpdates },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-on-surface dark:text-white mb-1">{item.id}</h4>
                        <p className="text-[10px] font-bold text-outline dark:text-slate-500">{item.desc}</p>
                      </div>
                      <button onClick={() => item.setter(!item.state)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${item.state ? 'bg-tertiary-fixed shadow-lg' : 'bg-surface-container-highest dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${item.state ? 'left-8' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-4">
                  {saveMsg && <span className="text-sm font-bold text-tertiary dark:text-emerald-400">{saveMsg}</span>}
                  <button onClick={handleSaveSettings} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                    Save Changes
                  </button>
                </div>
              </section>
            )}

            {/* ─── PREFERENCES TAB ─── */}
            {activeTab === 'Preferences' && (
              <section className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/10 dark:border-slate-800 rounded-[40px] p-10 shadow-xl space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface dark:text-white mb-1 tracking-tight">Appearance</h2>
                  <p className="text-sm font-bold text-outline dark:text-slate-500 uppercase tracking-widest">Interface & display preferences</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => { if (isDark) toggleDark(); }} className={`p-4 rounded-3xl cursor-pointer transition-all border-4 ${!isDark ? 'border-primary bg-primary/5' : 'border-surface-container-low dark:border-slate-800 bg-surface-container-low dark:bg-slate-800'}`}>
                    <div className="h-16 bg-white border border-outline-variant/10 rounded-2xl mb-4 shadow-sm"></div>
                    <p className="text-center text-[10px] font-black text-on-surface dark:text-white uppercase tracking-widest">Light Mode</p>
                  </div>
                  <div onClick={() => { if (!isDark) toggleDark(); }} className={`p-4 rounded-3xl cursor-pointer transition-all border-4 ${isDark ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-surface-container-low bg-surface-container-low'}`}>
                    <div className="h-16 bg-slate-900 rounded-2xl mb-4 shadow-sm"></div>
                    <p className="text-center text-[10px] font-black text-on-surface dark:text-white uppercase tracking-widest">Dark Mode</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                  {saveMsg && <span className="text-sm font-bold text-tertiary dark:text-emerald-400">{saveMsg}</span>}
                  <button onClick={handleSaveSettings} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                    Save Preferences
                  </button>
                </div>
              </section>
            )}

          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
