import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { CheckCircle, XCircle, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  // BUG FIX : remplace window.prompt (bloqué sur mobile) par un état React
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter],
    queryFn: () => adminApi.payments(page, statusFilter).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => adminApi.validatePayment(id),
    onSuccess: () => {
      toast.success('Paiement validé, crédits ajoutés');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectPayment(id, reason),
    onSuccess: () => {
      toast.success('Paiement refusé');
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const handleRejectConfirm = (id: string) => {
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  const payments = data?.payments || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
        <h1 className="text-xl font-bold">Gestion des paiements</h1>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {(['', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 border font-mono transition-colors ${statusFilter === s
              ? 'border-green-400 text-green-400 bg-green-900 bg-opacity-10'
              : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>
            {s === '' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'approved' ? 'Validés' : 'Refusés'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">Aucun paiement</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Réf.</th><th>Utilisateur</th><th>Pack</th>
                <th>Montant</th><th>Crédits</th><th>Statut</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <>
                  <tr key={p.id}>
                    <td className="text-cyan-400 text-xs font-mono">{p.ref}</td>
                    <td>
                      <div className="text-sm">{p.username}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td>{p.pack_name}</td>
                    <td className="font-bold">{p.amount} FCFA</td>
                    <td className="text-yellow-400 font-bold">+{p.credits}</td>
                    <td>
                      {p.status === 'pending' && <span className="badge-pending text-xs"><Clock className="w-2.5 h-2.5" /> Attente</span>}
                      {p.status === 'approved' && <span className="badge-running text-xs"><CheckCircle className="w-2.5 h-2.5" /> Validé</span>}
                      {p.status === 'rejected' && <span className="badge-error text-xs"><XCircle className="w-2.5 h-2.5" /> Refusé</span>}
                    </td>
                    <td className="text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {p.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => validateMutation.mutate(p.id)}
                            disabled={validateMutation.isPending}
                            className="btn-primary text-xs py-1 px-2" title="Valider">
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          {/* BUG FIX : toggle un panneau inline au lieu de window.prompt */}
                          <button onClick={() => {
                            setRejectingId(rejectingId === p.id ? null : p.id);
                            setRejectReason('');
                          }}
                            disabled={rejectMutation.isPending}
                            className="btn-danger text-xs py-1 px-2" title="Refuser">
                            <XCircle className="w-3 h-3" />
                            {rejectingId === p.id ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {/* Panneau de refus inline — s'affiche sous la ligne concernée */}
                  {rejectingId === p.id && (
                    <tr key={`reject-${p.id}`} className="bg-red-900 bg-opacity-10">
                      <td colSpan={8} className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-400 flex-shrink-0">Raison du refus :</span>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRejectConfirm(p.id)}
                            className="input-field flex-1 text-xs py-1"
                            placeholder="Paiement non reçu, mauvaise référence... (optionnel)"
                            autoFocus
                          />
                          <button onClick={() => handleRejectConfirm(p.id)}
                            disabled={rejectMutation.isPending}
                            className="btn-danger text-xs py-1 px-3 flex-shrink-0">
                            {rejectMutation.isPending ? '...' : 'Confirmer le refus'}
                          </button>
                          <button onClick={() => setRejectingId(null)}
                            className="btn-secondary text-xs py-1 px-2 flex-shrink-0">
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
