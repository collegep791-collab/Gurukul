/**
 * Sidebar.jsx
 * 
 * Technical Component: Main Navigation Sidebar
 * Description: Implements a responsive left sidebar navigation for the Gurukul application.
 * It filters navigation links dynamically based on the current user's role (Admin, Teacher, Student),
 * highlighting the active link using React Router, and resolves role-specific routing like 
 * directing teachers to /teacher/dashboard and students to /student/dashboard.
 * 
 * Dependecies: react-router-dom, DataContext
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const navItems = [
  { path: '/admin/dashboard', icon: 'monitoring', label: 'Atheneum', role: ['ADMIN'] },
  { path: '/student/dashboard', icon: 'dashboard_customize', label: 'Dashboard', role: ['STUDENT', 'TEACHER'] },
  { path: '/resources', icon: 'folder_open', label: 'Resources', role: ['ADMIN', 'STUDENT', 'TEACHER'] },
  { path: '/assignments', icon: 'assignment', label: 'Assignments', role: ['ADMIN', 'STUDENT', 'TEACHER'] },
  { path: '/chat', icon: 'forum', label: 'Chat', role: ['ADMIN', 'STUDENT', 'TEACHER'] },
  { path: '/notes', icon: 'edit_note', label: 'Notes', role: ['ADMIN', 'STUDENT', 'TEACHER'] },
  { path: '/users', icon: 'group', label: 'Users', role: ['ADMIN'] },
  { path: '/audit', icon: 'history', label: 'Audit Logs', role: ['ADMIN'] },
  { path: '/settings', icon: 'settings', label: 'Settings', role: ['ADMIN', 'STUDENT', 'TEACHER'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useData();

  const filteredItems = navItems
    .filter(item => item.role.includes(user?.role))
    .map(item => {
      // Dynamic routing adjustment: Teachers go to /teacher/dashboard, students to /student/dashboard
      if (item.path === '/student/dashboard' && user?.role === 'TEACHER') {
        return { ...item, path: '/teacher/dashboard' };
      }
      return item;
    });
  const navigate = useNavigate();


  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 pt-4 h-[calc(100vh-64px)] w-64 bg-surface-container-low dark:bg-slate-950 border-r border-outline-variant/10 dark:border-slate-800/50 fixed left-0 overflow-y-auto">
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 p-2">
          {/* Logo updated across all views */}
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
          </div>
          <div>
            <p className="text-sm md:text-base font-extrabold uppercase tracking-wide text-primary dark:text-indigo-400">Class Room Companion</p>
            <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">Modern Scholar</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link 
              key={item.label}
              to={item.path} 
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out rounded-lg ${
                isActive 
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 space-y-4">
        {user.role !== 'STUDENT' && (
          <button onClick={() => navigate('/resources')} className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Resource
          </button>
        )}
        <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
          <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            Help Center
          </button>
        </div>
      </div>
    </aside>
  );
}
