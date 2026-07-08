import { Bell, X, CheckCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../lib/api';

interface Notification {
  id: string; title: string; message: string; type: string; created_at: string;
}

interface Props { notifications: Notification[]; onClose: () => void; }

export function NotificationDropdown({ notifications, onClose }: Props) {
  const queryClient = useQueryClient();
  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead().then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const typeColor: Record<string, string> = {
    info: 'text-cyan-400', success: 'text-green-400',
    warning: 'text-yellow-400', error: 'text-red-400',
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 shadow-xl z-50 animate-slide-up">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <Bell className="w-3 h-3" /> NOTIFICATIONS ({notifications.length})
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button onClick={() => markAll.mutate()} className="text-xs text-gray-600 hover:text-green-400 transition-colors flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Tout lire
            </button>
          )}
          <button onClick={onClose} className="text-gray-600 hover:text-white"><X className="w-3 h-3" /></button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-600 text-xs font-mono">
            Aucune nouvelle notification
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="px-3 py-2.5 border-b border-gray-800 hover:bg-gray-800 transition-colors">
              <div className={`text-xs font-bold font-mono ${typeColor[n.type] || 'text-gray-300'}`}>{n.title}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</div>
              <div className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
