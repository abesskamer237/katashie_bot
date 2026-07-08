import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Search, UserCheck, UserX, Plus, Minus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.users(page, search).then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => { toast.success('Statut modifié'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const creditMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => adminApi.addCredits(id, amount, 'Ajustement admin'),
    onSuccess: () => { toast.success('Crédits ajustés'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
          <h1 className="text-xl font-bold">Gestion des utilisateurs</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-9" placeholder="Rechercher par nom ou e-mail..." />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr><th>Utilisateur</th><th>Rôle</th><th>Crédits</th><th>Statut</th><th>Dernière connexion</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <div className="font-bold text-sm">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </td>
                  <td>{u.role === 'admin' ? <span className="badge-pending text-xs">ADMIN</span> : <span className="badge-stopped text-xs">USER</span>}</td>
                  <td><span className="text-yellow-400 font-bold">{u.credits}</span> cr.</td>
                  <td>
                    {u.is_active ? (
                      <span className="badge-running text-xs">Actif</span>
                    ) : (
                      <span className="badge-error text-xs">Bloqué</span>
                    )}
                  </td>
                  <td className="text-gray-500 text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/users/${u.id}`} className="btn-secondary text-xs py-1 px-2">
                        <Eye className="w-3 h-3" />
                      </Link>
                      <button onClick={() => creditMutation.mutate({ id: u.id, amount: 10 })}
                        className="btn-primary text-xs py-1 px-2" title="+10 crédits">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => creditMutation.mutate({ id: u.id, amount: -10 })}
                        className="btn-secondary text-xs py-1 px-2" title="-10 crédits">
                        <Minus className="w-3 h-3" />
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleMutation.mutate(u.id)}
                          className={u.is_active ? 'btn-danger text-xs py-1 px-2' : 'btn-primary text-xs py-1 px-2'}
                          title={u.is_active ? 'Bloquer' : 'Débloquer'}>
                          {u.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={p === page ? 'btn-primary text-xs py-1 px-3' : 'btn-secondary text-xs py-1 px-3'}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
