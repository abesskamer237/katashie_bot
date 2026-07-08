import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminServersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  // BUG FIX : remplace window.confirm (bloqué sur mobile/certains navigateurs) par un état React
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-servers', page],
    queryFn: () => adminApi.servers(page).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteServer(id),
    onSuccess: () => {
      toast.success('Serveur supprimé');
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-servers'] });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const servers = data?.servers || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
        <h1 className="text-xl font-bold">Tous les serveurs</h1>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>
        ) : servers.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">Aucun serveur</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Nom</th><th>Propriétaire</th><th>Statut</th><th>RAM</th><th>Coût</th><th>Expiration</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {servers.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-bold">{s.name}</td>
                  <td>
                    <div className="text-sm">{s.username}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </td>
                  <td>
                    {s.status === 'running'
                      ? <span className="badge-running text-xs">Running</span>
                      : <span className="badge-stopped text-xs">Stopped</span>}
                  </td>
                  <td>{s.ram}MB</td>
                  <td className="text-yellow-400">{s.credits_cost} cr.</td>
                  <td className="text-gray-500 text-xs">
                    {s.expires_at ? new Date(s.expires_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td>
                    {confirmDeleteId === s.id ? (
                      /* BUG FIX : confirmation inline — pas de window.confirm */
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-400 mr-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Confirmer ?
                        </span>
                        <button onClick={() => deleteMutation.mutate(s.id)}
                          disabled={deleteMutation.isPending}
                          className="btn-danger text-xs py-0.5 px-2">
                          {deleteMutation.isPending ? '...' : 'Oui'}
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="btn-secondary text-xs py-0.5 px-2">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(s.id)}
                        className="btn-danger text-xs py-1 px-2">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* BUG FIX (rev2) : pagination fenêtrée — plus de cap Math.min(15) qui bloquait au-delà */}
      {pagination && pagination.pages > 1 && (
        <div className="flex gap-2 justify-center flex-wrap items-center">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="btn-secondary text-xs py-1 px-3">← Préc.</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
            .reduce<(number | null)[]>((acc, p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1) acc.push(null);
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === null
                ? <span key={`ellipsis-${idx}`} className="text-gray-600 text-xs px-1">…</span>
                : <button key={p} onClick={() => setPage(p)}
                    className={p === page ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}>
                    {p}
                  </button>
            )}
          <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages}
            className="btn-secondary text-xs py-1 px-3">Suiv. →</button>
        </div>
      )}
    </div>
  );
}
