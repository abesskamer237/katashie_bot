import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { User, Zap, Server, History, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.user(id!).then(r => r.data.data),
  });

  const creditMutation = useMutation({
    mutationFn: () => {
      // BUG FIX : validation stricte avant envoi — évite NaN envoyé à l'API
      const amount = parseInt(creditAmount, 10);
      if (isNaN(amount) || amount === 0) throw new Error('Montant invalide');
      return adminApi.addCredits(id!, amount, creditReason);
    },
    onSuccess: () => {
      toast.success('Crédits ajustés');
      setCreditAmount('');
      setCreditReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (err: any) => {
      if (err?.message === 'Montant invalide') {
        toast.error('Entrez un montant valide (ex: 30 ou -10)');
        return;
      }
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => adminApi.toggleUser(id!),
    onSuccess: () => { toast.success('Statut modifié'); queryClient.invalidateQueries({ queryKey: ['admin-user', id] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>;
  if (!data) return <div className="text-center py-20 text-red-400 text-sm">Utilisateur introuvable</div>;

  const { user, servers, transactions } = data;

  // BUG FIX : calcul de validité du montant pour désactiver le bouton correctement
  const parsedAmount = parseInt(creditAmount, 10);
  const isAmountValid = creditAmount.trim() !== '' && !isNaN(parsedAmount) && parsedAmount !== 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN — UTILISATEUR</div>
        <h1 className="text-xl font-bold">{user.username}</h1>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infos */}
        <div className="card">
          <div className="section-title"><User className="w-3.5 h-3.5" /> Informations</div>
          <div className="space-y-2 text-sm">
            {[
              ['Rôle', user.role],
              ['Crédits', `${user.credits} cr.`],
              ['Statut', user.is_active ? 'Actif' : 'Bloqué'],
              ['Inscription', new Date(user.created_at).toLocaleDateString('fr-FR')],
              ['Dernière IP', user.last_ip || 'Inconnue'],
              ['Dernière connexion', user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-500">{k}</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {user.role !== 'admin' && (
              <button onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                className={user.is_active ? 'btn-danger text-xs py-1.5 px-3' : 'btn-primary text-xs py-1.5 px-3'}>
                {user.is_active ? <><UserX className="w-3 h-3" /> Bloquer</> : <><UserCheck className="w-3 h-3" /> Débloquer</>}
              </button>
            )}
          </div>
        </div>

        {/* Credit management */}
        <div className="card">
          <div className="section-title"><Zap className="w-3.5 h-3.5" /> Gestion des crédits</div>
          <div className="space-y-3">
            <div>
              <label className="label">Montant (positif = ajouter, négatif = retirer)</label>
              <input
                type="number"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                className="input-field"
                placeholder="ex: 30 ou -10"
                step="1"
              />
              {/* BUG FIX : feedback visuel si la valeur est invalide */}
              {creditAmount !== '' && !isAmountValid && (
                <p className="text-xs text-red-400 mt-1">Entrez un nombre entier non nul</p>
              )}
            </div>
            <div>
              <label className="label">Raison</label>
              <input
                type="text"
                value={creditReason}
                onChange={e => setCreditReason(e.target.value)}
                className="input-field"
                placeholder="Paiement validé, correction, bonus..."
                maxLength={200}
              />
            </div>
            <button
              onClick={() => creditMutation.mutate()}
              disabled={!isAmountValid || creditMutation.isPending}
              className="btn-primary text-sm">
              {creditMutation.isPending ? 'En cours...' : '> Appliquer'}
            </button>
          </div>
        </div>
      </div>

      {/* Servers */}
      <div className="card">
        <div className="section-title"><Server className="w-3.5 h-3.5" /> Serveurs ({servers.length})</div>
        {servers.length === 0 ? (
          <div className="text-gray-600 text-xs">Aucun serveur</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Statut</th><th>Coût</th><th>Expiration</th></tr></thead>
            <tbody>
              {servers.map((s: any) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.status === 'running' ? <span className="badge-running text-xs">Running</span> : <span className="badge-stopped text-xs">Stopped</span>}</td>
                  <td className="text-yellow-400">{s.credits_cost} cr.</td>
                  <td className="text-gray-500 text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString('fr-FR') : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="section-title"><History className="w-3.5 h-3.5" /> Dernières transactions</div>
        {transactions.length === 0 ? (
          <div className="text-gray-600 text-xs">Aucune transaction</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Description</th></tr></thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}>
                  <td className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>{t.type === 'credit' ? <span className="badge-running text-xs">+CRÉDIT</span> : <span className="badge-error text-xs">-DÉBIT</span>}</td>
                  <td className={t.type === 'credit' ? 'text-green-400' : 'text-red-400'}>{t.type === 'credit' ? '+' : '-'}{t.amount}</td>
                  <td className="text-gray-500 text-xs">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
