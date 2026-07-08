import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { ScrollText } from 'lucide-react';

export function AdminLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: () => adminApi.logs(page).then(r => r.data.data),
    refetchInterval: 10000,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const actionColors: Record<string, string> = {
    LOGIN: 'text-green-400', REGISTER: 'text-cyan-400',
    SERVER_CREATE: 'text-blue-400', SERVER_DELETE: 'text-red-400',
    SERVER_START: 'text-green-400', SERVER_STOP: 'text-yellow-400',
    ADMIN_ADD_CREDITS: 'text-green-400', ADMIN_REMOVE_CREDITS: 'text-red-400',
    ADMIN_BLOCK_USER: 'text-red-400', ADMIN_UNBLOCK_USER: 'text-green-400',
    ADMIN_VALIDATE_PAYMENT: 'text-green-400', ADMIN_REJECT_PAYMENT: 'text-red-400',
    PAYMENT_REQUEST: 'text-yellow-400', LOGIN_FAILED: 'text-red-400',
    PASSWORD_RESET: 'text-cyan-400', DEFAULT: 'text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
        <h1 className="text-xl font-bold">Journaux système</h1>
      </div>

      <div className="terminal-box h-auto min-h-96 overflow-x-auto">
        <div className="flex items-center gap-2 text-gray-600 mb-3 pb-2 border-b border-gray-800 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2">katashie-bot — system logs</span>
          <ScrollText className="w-3 h-3 ml-auto" />
        </div>

        {isLoading ? (
          <div className="text-gray-600">Chargement<span className="cursor-blink">_</span></div>
        ) : logs.length === 0 ? (
          <div className="text-gray-600">Aucun log enregistré</div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log: any) => (
              <div key={log.id} className="hover:bg-gray-950 px-1 py-0.5 transition-colors group">
                <span className="text-gray-600">[{new Date(log.created_at).toLocaleString('fr-FR')}]</span>{' '}
                <span className={actionColors[log.action] || actionColors.DEFAULT}>[{log.action}]</span>{' '}
                {log.username && <span className="text-cyan-400">@{log.username}</span>}{' '}
                {log.entity && <span className="text-gray-500">{log.entity}:{log.entity_id?.substring(0, 8)}</span>}{' '}
                {log.details && <span className="text-gray-400">{log.details}</span>}{' '}
                {log.ip && <span className="text-gray-700 text-xs group-hover:text-gray-500">({log.ip})</span>}
              </div>
            ))}
          </div>
        )}

        <div className="text-green-400 flex items-center gap-1 mt-3">
          <span>root@katashie:~$</span><span className="cursor-blink">_</span>
        </div>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={p === page ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
