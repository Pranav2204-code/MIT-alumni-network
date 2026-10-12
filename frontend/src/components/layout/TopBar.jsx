import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../lib/axios';

export default function TopBar() {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/users/me/notifications?unreadOnly=true')
      .then(({ data }) => setUnread(data.data.unreadCount))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Points pill */}
      <div className="flex items-center gap-2 bg-gold-400/10 border border-gold-400/30 px-3 py-1.5 rounded-full">
        <span className="text-base">🪙</span>
        <span className="text-sm font-semibold text-gold-600">
          {user?.referralPoints ?? 0} pts
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/referrals"
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Referrals & notifications"
        >
          <span className="text-lg">🔔</span>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
