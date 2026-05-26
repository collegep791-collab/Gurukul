/**
 * TopNav.jsx
 * 
 * Technical Component: Top Navigation Bar
 * Description: Implements a responsive top navigation bar for the Gurukul application.
 * It manages real-time student notification overlays, unread notification counts,
 * dark mode toggling, user profiles, mobile search inputs, and logout flows.
 * 
 * Dependencies: react-router-dom, ThemeContext, DataContext, dateUtils
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { toLocalTime } from '../lib/dateUtils';


export default function TopNav() {
  const { isDark, toggleDark } = useTheme();
  const { user, logout, notifications, unreadCount, markNotificationRead, markAllRead, searchQuery, setSearchQuery } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (notif) => {
    if (!notif.read) markNotificationRead(notif.id);
    if (notif.link) navigate(notif.link);
    setShowNotifs(false);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'assignment': return 'assignment';
      case 'grade': return 'grade';
      case 'resource': return 'description';
      case 'chat': return 'chat';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'grade': return 'text-tertiary dark:text-emerald-400 bg-tertiary-fixed dark:bg-emerald-900/50';
      case 'warning': return 'text-error bg-error-container dark:bg-red-900/50';
      case 'assignment': return 'text-primary dark:text-indigo-400 bg-primary-fixed dark:bg-indigo-900/50';
      default: return 'text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-800';
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm shadow-indigo-900/5 transition-all">
      <div className="flex justify-between items-center h-16 px-4 md:px-6 w-full max-w-full relative">
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-sm shadow-primary/20">
              <span className="material-symbols-outlined text-lg md:text-xl" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tight text-primary dark:text-indigo-400 hidden sm:block">Gurukul</span>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:flex relative group flex-shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm w-48 lg:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none dark:text-white dark:placeholder-slate-500" 
              placeholder="Search..." 
              type="text" 
            />
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="md:hidden absolute inset-0 bg-white dark:bg-slate-900 z-50 flex items-center px-4 gap-2">
            <button onClick={() => setShowMobileSearch(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <input 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-surface-container-low dark:bg-slate-800 border-none rounded-full py-2 px-4 text-sm focus:outline-none dark:text-white" 
              placeholder="Search..." 
              type="text" 
            />
          </div>
        )}

        <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
          <button 
            className="md:hidden p-2 text-slate-500 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
            onClick={() => setShowMobileSearch(true)}
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors rounded-full relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="fixed top-16 right-4 md:absolute md:top-12 md:right-0 w-[calc(100vw-32px)] md:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-outline-variant/10 dark:border-slate-800 overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 dark:border-slate-800">
                  <h4 className="text-sm font-black text-on-surface dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest hover:underline min-w-[44px] min-h-[44px]">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/5 dark:divide-slate-800">
                  {notifications.length === 0 && (
                    <div className="px-5 py-10 text-center">
                      <span className="material-symbols-outlined text-3xl text-outline/20 dark:text-slate-700 block mb-2">notifications_off</span>
                      <p className="text-xs text-on-surface-variant dark:text-slate-500 font-medium">No notifications yet.</p>
                    </div>
                  )}
                  {notifications.slice(0, 10).map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-surface-container-low/50 dark:hover:bg-slate-800/50 transition-colors ${!notif.read ? 'bg-primary/5 dark:bg-indigo-900/10' : ''}`}
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                        <span className="material-symbols-outlined text-lg">{getNotifIcon(notif.type)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-black truncate ${!notif.read ? 'text-on-surface dark:text-white' : 'text-on-surface-variant dark:text-slate-400'}`}>{notif.title}</p>
                          {!notif.read && <span className="w-2 h-2 bg-primary dark:bg-indigo-500 rounded-full flex-shrink-0 mt-1"></span>}
                        </div>
                        <p className="text-[10px] text-on-surface-variant dark:text-slate-500 line-clamp-1 mt-0.5">{notif.body}</p>
                        <p className="text-[9px] text-outline dark:text-slate-600 mt-1 font-bold">{toLocalTime(notif.created_at).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleDark}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors rounded-full"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {user && (
            <div className="flex items-center md:gap-3">
              <div className="relative" ref={profileRef}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="h-8 w-8 rounded-full overflow-hidden border border-primary/10 ml-1 block outline-none">
                  <img alt={user.name} className="h-full w-full object-cover" src={user.avatar} />
                </button>
                {showProfileMenu && (
                  <div className="md:hidden fixed top-16 right-4 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-outline-variant/10 dark:border-slate-800 z-50 overflow-hidden transform origin-top-right transition-all">
                    <div className="px-4 py-3 border-b border-outline-variant/10 dark:border-slate-800">
                      <p className="text-xs font-black truncate text-on-surface dark:text-white">{user.name}</p>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs font-bold text-error dark:text-red-400 hover:bg-error/5 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="hidden md:flex p-2 min-w-[44px] min-h-[44px] items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-full"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
