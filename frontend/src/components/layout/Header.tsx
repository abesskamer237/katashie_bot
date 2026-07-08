import { Menu, Bell, Zap, Terminal } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../lib/api';
import { useState } from 'react';
import { NotificationDropdown } from '../ui/NotificationDropdown';

interface HeaderProps { onMenuClick: () => void; }

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list().then(r => r.data.data.notifications),
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.length || 0;

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600 font-mono">
          <Terminal className="w-3 h-3 text-green-400" />
          <span className="text-green-400">root</span>
          <span>@katashie</span>
          <span className="text-gray-700">~</span>
          <span className="text-gray-500 cursor-blink">_</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Credits */}
        <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-gray-800 border border-gray-700 text-xs font-mono">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-yellow-400 font-bold">{user?.credits ?? 0}</span>
          <span className="text-gray-500">crédits</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative text-gray-400 hover:text-white transition-colors p-1"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationDropdown
              notifications={notifData || []}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="w-7 h-7 bg-gray-800 border border-green-400 flex items-center justify-center">
            <span className="text-green-400 text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-gray-300">{user?.username}</span>
        </div>
      </div>
    </header>
  );
}
