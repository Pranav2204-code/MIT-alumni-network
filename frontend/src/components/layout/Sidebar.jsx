import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '🏠', roles: ['student','alumni','admin'] },
  { to: '/directory',  label: 'Directory',  icon: '👥', roles: ['student','alumni','admin'] },
  { to: '/jobs',       label: 'Jobs',       icon: '💼', roles: ['student','alumni','admin'] },
  { to: '/quizzes',    label: 'Quizzes',    icon: '🧠', roles: ['student','alumni','admin'] },
  { to: '/referrals',  label: 'Referrals',  icon: '🤝', roles: ['student','alumni','admin'] },
  { to: '/wallet',     label: 'Wallet',     icon: '🪙', roles: ['student','alumni','admin'] },
  { to: '/admin',      label: 'Admin',      icon: '⚙️', roles: ['admin'] },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200 gap-2">
        <span className="text-xl">🎓</span>
        <span className="font-semibold text-sm text-gray-900 leading-tight">
          MIT-WPU<br />
          <span className="font-normal text-gray-500">Alumni Network</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User chip */}
      <div className="border-t border-gray-200 p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
}
