import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Users, Server, CreditCard, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then(r => r.data.data),
    refetchInterval: 15000,
  });

  const statCards = [
    { icon: Users, label: 'Utilisateurs', value: stats?.users ?? 0, color: 'text-cyan-400' },
    { icon: Server, label: 'Serveurs actifs', value: stats?.activeServers ?? 0, color: 'text-green-400' },
    { icon: Server, label: 'Serveurs total', value: stats?.totalServers ?? 0, color: 'text-gray-300' },
    { icon: CreditCard, label: 'Paiements en attente', value: stats?.pendingPayments ?? 0, color: 'text-yellow-400' },
    { icon: Activity, label: 'Crédits distribués', value: stats?.totalCreditsDistributed ?? 0, color: 'text-purple-400' },
  ];

  const chartData = statCards.slice(0, 4).map(s => ({ name: s.label.split(' ')[0], value: s.value }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-yellow-400 mb-1">// ADMIN DASHBOARD</div>
        <h1 className="text-xl font-bold">Vue d&apos;ensemble</h1>
      </div>

      {/* BUG FIX : utilise <Link> (React Router) au lieu de <a> pour éviter le rechargement complet */}
      {(stats?.pendingPayments ?? 0) > 0 && (
        <div className="border border-yellow-400 border-opacity-50 bg-yellow-900 bg-opacity-10 px-4 py-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400 font-bold">{stats!.pendingPayments} paiement(s) en attente</span>
          <span className="text-gray-400">— Action requise dans</span>
          <Link to="/admin/payments" className="text-yellow-400 underline ml-1 hover:text-yellow-300">
            Paiements
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <div className={`stat-value ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title"><Activity className="w-3.5 h-3.5" /> Aperçu statistiques</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={30}>
              <XAxis dataKey="name" tick={{ fill: '#5a5a70', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a70', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid #252530', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
              <Bar dataKey="value" radius={0}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={['#00d4ff', '#00ff41', '#5a5a70', '#ffd700'][i % 4]} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BUG FIX : <Link> au lieu de <a> partout pour rester dans le SPA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Gérer les utilisateurs', desc: 'Ajouter/retirer des crédits, bloquer, voir les détails', to: '/admin/users' },
          { title: 'Valider les paiements', desc: 'Approuver ou refuser les demandes de recharge', to: '/admin/payments' },
          { title: 'Gérer les packs', desc: 'Créer, modifier et supprimer les offres de crédits', to: '/admin/packs' },
        ].map(item => (
          <Link key={item.title} to={item.to} className="card hover:border-yellow-400 hover:border-opacity-30 transition-all group block">
            <h3 className="text-sm font-bold text-yellow-400 mb-1 group-hover:glow-green">{item.title}</h3>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
