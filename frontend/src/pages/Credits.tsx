import { useQuery, useMutation } from '@tanstack/react-query';
import { creditApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Zap, CreditCard, History, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { CreditWhatsAppCard } from '../components/ui/CreditWhatsAppCard';

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: 'En attente', className: 'badge-pending', icon: Clock },
  approved: { label: 'Validé', className: 'badge-running', icon: CheckCircle },
  rejected: { label: 'Refusé', className: 'badge-error', icon: XCircle },
};

export function CreditsPage() {
  const { user } = useAuthStore();

  const { data: packs = [] } = useQuery({
    queryKey: ['credit-packs'],
    queryFn: () => creditApi.packs().then(r => r.data.data.packs),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => creditApi.history().then(r => r.data.data.transactions),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['payment-requests'],
    queryFn: () => creditApi.requests().then(r => r.data.data.requests),
  });

  const payMutation = useMutation({
    mutationFn: (packId: string) => creditApi.requestPayment(packId).then(r => r.data),
    onSuccess: (data) => {
      toast.success('Lien WhatsApp généré ! Vous allez être redirigé...');
      setTimeout(() => { window.open(data.data.whatsappLink, '_blank'); }, 500);
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-gray-500 mb-1">// CRÉDITS</div>
        <h1 className="text-xl font-bold">Gestion des crédits</h1>
      </div>

      {/* Balance */}
      <div className="card border-glow-green">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-2">SOLDE ACTUEL</div>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-4xl font-bold text-yellow-400">{user?.credits ?? 0}</div>
                <div className="text-xs text-gray-500">crédits disponibles</div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Minimum serveur : 15 cr.</div>
            <div className="text-green-400 mt-1">Rechargez ci-dessous</div>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div>
        <div className="section-title"><CreditCard className="w-3.5 h-3.5" /> Packs disponibles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map((pack: any) => (
            <div key={pack.id} className="card hover:border-green-400 hover:border-opacity-40 transition-all group">
              <div className="text-xs text-gray-500 mb-1">{pack.name}</div>
              <div className="text-2xl font-bold text-green-400 mb-0.5">{pack.credits} <span className="text-sm text-gray-500">cr.</span></div>
              <div className="text-lg font-bold text-white">{pack.price} <span className="text-xs text-gray-500">FCFA</span></div>
              <div className="text-xs text-gray-600 mb-1">{pack.duration_days} jours</div>
              {pack.description && <div className="text-xs text-gray-600 mb-3 leading-relaxed">{pack.description}</div>}
              <button
                onClick={() => payMutation.mutate(pack.id)}
                disabled={payMutation.isPending}
                className="btn-primary w-full justify-center text-xs py-2 mt-auto"
              >
                <ExternalLink className="w-3 h-3" /> Acheter via WhatsApp
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <CreditWhatsAppCard compact className="mt-0" />
        </div>
      </div>

      {/* Demandes récentes */}
      {requests.length > 0 && (
        <div>
          <div className="section-title"><AlertCircle className="w-3.5 h-3.5" /> Mes demandes de paiement</div>
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Référence</th><th>Pack</th><th>Montant</th><th>Crédits</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {requests.map((r: any) => {
                  const s = statusConfig[r.status] || statusConfig.pending;
                  const StatusIcon = s.icon;
                  return (
                    <tr key={r.id}>
                      <td className="font-mono text-cyan-400 text-xs">{r.ref}</td>
                      <td>{r.pack_name}</td>
                      <td>{r.amount} FCFA</td>
                      <td className="text-yellow-400">+{r.credits}</td>
                      <td><span className={s.className + ' text-xs'}><StatusIcon className="w-2.5 h-2.5" /> {s.label}</span></td>
                      <td className="text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historique transactions */}
      <div>
        <div className="section-title"><History className="w-3.5 h-3.5" /> Historique des transactions</div>
        <div className="card overflow-x-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs">Aucune transaction</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Solde</th><th>Description</th></tr></thead>
              <tbody>
                {history.map((t: any) => (
                  <tr key={t.id}>
                    <td className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>{t.type === 'credit' ? <span className="badge-running text-xs">CRÉDIT</span> : <span className="badge-error text-xs">DÉBIT</span>}</td>
                    <td className={t.type === 'credit' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {t.type === 'credit' ? '+' : '-'}{t.amount}
                    </td>
                    <td className="text-gray-300">{t.balance_after} cr.</td>
                    <td className="text-gray-500 text-xs max-w-xs truncate">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
