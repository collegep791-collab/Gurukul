import { NavLink } from 'react-router-dom';

export default function BottomNav({ role }) {
  const getBasePath = () => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'TEACHER': return '/teacher';
      default: return '/student';
    }
  };

  const base = getBasePath();

  const links = [
    { to: `/${role.toLowerCase()}/dashboard`, icon: 'dashboard', label: 'Home' },
    { to: `/resources`, icon: 'library_books', label: 'Docs' },
    { to: `/chat`, icon: 'forum', label: 'Chat' },
    { to: `/assignments`, icon: 'task', label: 'Tasks' },
    { to: `/notes`, icon: 'note', label: 'Notes' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-outline-variant/30 z-50 px-2 pb-safe pt-2">
      <ul className="flex justify-around items-center h-16">
        {links.map((link) => (
          <li key={link.to} className="flex-1">
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`px-4 py-1 rounded-full transition-all ${isActive ? 'bg-primary-fixed/20' : ''}`}>
                    <span 
                      className="material-symbols-outlined text-[24px]" 
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {link.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
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
