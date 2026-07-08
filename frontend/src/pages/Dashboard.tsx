import { useQuery } from '@tanstack/react-query';
import { serverApi, creditApi, notificationApi, announcementApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Server, Zap, Activity, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverApi.list().then(r => r.data.data.servers),
  });

  const { data: txData } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => creditApi.history().then(r => r.data.data.transactions),
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementApi.list().then(r => r.data.data.announcements),
  });

  const servers = serversData || [];
  const transactions = txData || [];
  const running = servers.filter((s: any) => s.status === 'running').length;
  const stopped = servers.filter((s: any) => s.status === 'stopped').length;
  const expired = servers.filter((s: any) => s.expires_at && new Date(s.expires_at) < new Date()).length;

  // Données du graphique (7 derniers jours)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const total = transactions.filter((t: any) => {
      const td = new Date(t.created_at);
      return td.toDateString() === d.toDateString();
    }).reduce((acc: number, t: any) => acc + (t.type === 'debit' ? t.amount : 0), 0);
    return { day: label, dépenses: total };
  });

  const announcementColors: Record<string, string> = {
    info: 'border-cyan-400 bg-cyan-900 bg-opacity-10',
    success: 'border-green-400 bg-green-900 bg-opacity-10',
    warning: 'border-yellow-400 bg-yellow-900 bg-opacity-10',
    error: 'border-red-400 bg-red-900 bg-opacity-10',
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div className="text-xs text-gray-500 mb-1">// TABLEAU DE BORD</div>
        <h1 className="text-xl font-bold">
          Bonjour, <span className="text-green-400">{user?.username}</span>
          <span className="cursor-blink text-green-400"> _</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Announcements */}
      {announcements?.map((a: any) => (
        <div key={a.id} className={`border px-4 py-3 text-xs font-mono ${announcementColors[a.type] || 'border-gray-700 bg-gray-800'}`}>
          <span className="font-bold text-white">[ANNONCE] {a.title} — </span>
          <span className="text-gray-400">{a.content}</span>
        </div>
      ))}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Crédits</span>
          </div>
          <div className="stat-value text-yellow-400">{user?.credits ?? 0}</div>
          <Link to="/credits" className="text-xs text-gray-600 hover:text-green-400 mt-1 block">Recharger →</Link>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">En ligne</span>
          </div>
          <div className="stat-value text-green-400">{running}</div>
          <div className="text-xs text-gray-600">{servers.length} serveur(s) total</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Arrêtés</span>
          </div>
          <div className="stat-value">{stopped}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Expirés</span>
          </div>
          <div className="stat-value text-red-400">{expired}</div>
          {expired > 0 && <div className="text-xs text-red-600">Action requise</div>}
        </div>
      </div>

      {/* Grid: chart + servers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="card">
          <div className="section-title">
            <TrendingUp className="w-3.5 h-3.5" /> Dépenses (7 jours)
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#5a5a70', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a70', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111118', border: '1px solid #252530', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                  labelStyle={{ color: '#00ff41' }} itemStyle={{ color: '#b0b0c0' }}
                />
                <Area type="monotone" dataKey="dépenses" stroke="#00ff41" fill="url(#greenGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent servers */}
        <div className="card">
          <div className="section-title">
            <Server className="w-3.5 h-3.5" /> Derniers serveurs
          </div>
          {servers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Aucun serveur. <Link to="/servers/create" className="text-green-400 hover:underline">Créer maintenant →</Link></p>
            </div>
          ) : (
            <div className="space-y-2">
              {servers.slice(0, 5).map((s: any) => (
                <Link to={`/servers/${s.id}`} key={s.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-900 hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`status-dot ${s.status === 'running' ? 'running' : 'stopped'}`} />
                    <span className="text-sm truncate group-hover:text-green-400 transition-colors">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </Link>
              ))}
              {servers.length > 5 && (
                <Link to="/servers" className="block text-center text-xs text-gray-600 hover:text-green-400 pt-2">
                  Voir tous les serveurs ({servers.length}) →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="section-title">
          <Zap className="w-3.5 h-3.5" /> Dernières transactions
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-600">Aucune transaction</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Montant</th><th>Solde après</th><th>Description</th></tr></thead>
              <tbody>
                {transactions.slice(0, 10).map((t: any) => (
                  <tr key={t.id}>
                    <td className="text-gray-400">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>{t.type === 'credit' ? <span className="badge-running">+CRÉDIT</span> : <span className="badge-error">-DÉBIT</span>}</td>
                    <td className={t.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                      {t.type === 'credit' ? '+' : '-'}{t.amount} cr.
                    </td>
                    <td className="text-gray-300">{t.balance_after} cr.</td>
                    <td className="text-gray-500 max-w-xs truncate">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
