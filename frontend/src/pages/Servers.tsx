import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serverApi } from '../lib/api';
import { Server, Plus, Play, Square, RotateCcw, Trash2, Eye, Terminal, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export function ServersPage() {
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serverApi.list().then(r => r.data.data.servers),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => serverApi.start(id),
    onSuccess: (_, id) => { toast.success('Serveur démarré'); queryClient.invalidateQueries({ queryKey: ['servers'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => serverApi.stop(id),
    onSuccess: () => { toast.success('Serveur arrêté'); queryClient.invalidateQueries({ queryKey: ['servers'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const restartMutation = useMutation({
    mutationFn: (id: string) => serverApi.restart(id),
    onSuccess: () => { toast.success('Serveur redémarré'); queryClient.invalidateQueries({ queryKey: ['servers'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serverApi.delete(id),
    onSuccess: () => { toast.success('Serveur supprimé'); queryClient.invalidateQueries({ queryKey: ['servers'] }); },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Supprimer définitivement "${name}" ? Cette action est irréversible.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">// MES SERVEURS</div>
          <h1 className="text-xl font-bold">Gestion des serveurs</h1>
        </div>
        <Link to="/servers/create" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nouveau serveur
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="card text-center py-16">
          <Terminal className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Aucun serveur configuré</p>
          <p className="text-xs text-gray-600 mb-6">Créez votre premier bot WhatsApp dès maintenant</p>
          <Link to="/servers/create" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Créer mon premier serveur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {servers.map((s: any) => {
            const isExpired = s.expires_at && new Date(s.expires_at) < new Date();
            const isRunning = s.status === 'running';
            return (
              <div key={s.id} className={`card ${isExpired ? 'border-red-800 border-opacity-50' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`status-dot ${isRunning ? 'running' : 'stopped'} flex-shrink-0`} />
                    <h3 className="font-bold truncate">{s.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isRunning ? (
                      <span className="badge-running"><Server className="w-2.5 h-2.5" /> RUNNING</span>
                    ) : isExpired ? (
                      <span className="badge-error"><AlertCircle className="w-2.5 h-2.5" /> EXPIRÉ</span>
                    ) : (
                      <span className="badge-stopped">STOPPED</span>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="bg-gray-900 px-2 py-1">
                    <div className="text-gray-600">RAM</div>
                    <div className="text-white font-bold">{s.ram}MB</div>
                  </div>
                  <div className="bg-gray-900 px-2 py-1">
                    <div className="text-gray-600">CPU</div>
                    <div className="text-white font-bold">{s.cpu}%</div>
                  </div>
                  <div className="bg-gray-900 px-2 py-1">
                    <div className="text-gray-600">Sessions</div>
                    <div className="text-white font-bold">{s.max_sessions}</div>
                  </div>
                </div>

                {s.expires_at && (
                  <div className="text-xs text-gray-600 mb-3">
                    Expire le : <span className={isExpired ? 'text-red-400' : 'text-gray-400'}>
                      {new Date(s.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-700 flex-wrap">
                  {isRunning ? (
                    <button onClick={() => stopMutation.mutate(s.id)} disabled={stopMutation.isPending}
                      className="btn-danger text-xs py-1.5 px-3">
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  ) : (
                    <button onClick={() => startMutation.mutate(s.id)} disabled={startMutation.isPending || isExpired}
                      className="btn-primary text-xs py-1.5 px-3">
                      <Play className="w-3 h-3" /> Start
                    </button>
                  )}
                  <button onClick={() => restartMutation.mutate(s.id)} disabled={restartMutation.isPending}
                    className="btn-secondary text-xs py-1.5 px-3">
                    <RotateCcw className="w-3 h-3" /> Redémarrer
                  </button>
                  <Link to={`/servers/${s.id}`} className="btn-secondary text-xs py-1.5 px-3">
                    <Eye className="w-3 h-3" /> Détails
                  </Link>
                  <button onClick={() => handleDelete(s.id, s.name)} className="ml-auto text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
