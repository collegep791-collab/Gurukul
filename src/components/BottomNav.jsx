/**
 * src/components/BottomNav.jsx
 * 
 * Technical Component: Mobile Bottom Navigation Bar
 * Description: A fixed-position navigation bar rendered only on mobile viewports (hidden
 * on md+ screens via Tailwind). Uses React Router's NavLink for active-state highlighting
 * with Material Symbols icons. The navigation items dynamically adapt to the user's role
 * (e.g., ADMIN sees different paths than STUDENT). Follows iOS safe-area-inset conventions
 * for proper display on notched devices.
 * 
 * Demo Note: Resize browser to mobile width or use DevTools responsive mode to see this bar.
 */
import { NavLink } from 'react-router-dom';

export default function BottomNav({ role }) {
  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'TEACHER') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  const links = [
    { to: getDashboardPath(), icon: 'dashboard', label: 'Home' },
    { to: '/resources', icon: 'library_books', label: 'Docs' },
    { to: '/chat', icon: 'forum', label: 'Chat' },
    { to: '/assignments', icon: 'task', label: 'Tasks' },
    { to: '/notes', icon: 'note', label: 'Notes' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-outline-variant/20 dark:border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <ul className="flex justify-around items-center h-16 px-1">
        {links.map((link) => (
          <li key={link.to} className="flex-1">
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-200 ${
                  isActive ? 'text-primary dark:text-indigo-400' : 'text-on-surface-variant dark:text-slate-500 hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`px-4 py-1 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-fixed/30 dark:bg-indigo-900/40 scale-110' : ''}`}>
                    <span 
                      className="material-symbols-outlined text-[22px]" 
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {link.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
