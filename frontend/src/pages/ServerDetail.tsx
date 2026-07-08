import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serverApi } from '../lib/api';
import {
  Play, Square, RotateCcw, Trash2, Terminal, Wifi, WifiOff,
  QrCode, Settings, Server, Cpu, HardDrive, Clock, AlertTriangle, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useState, useRef } from 'react';

export function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'env' | 'qr'>('overview');
  // BUG FIX (rev2) : état d'édition unique — initialiser depuis envVars une seule fois
  // Utiliser combinedEnv = { ...envVars, ...newEnv } provoquait une régression :
  // quand on supprimait une clé dans newEnv, elle revenait depuis envVars au rendu suivant.
  const [editableEnv, setEditableEnv] = useState<Record<string, string> | null>(null);
  // BUG FIX : useRef au lieu de document.getElementById pour les inputs "ajouter une variable"
  const newKeyRef = useRef<HTMLInputElement>(null);
  const newValRef = useRef<HTMLInputElement>(null);
  // BUG FIX : confirmation inline au lieu de window.confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: server, isLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: () => serverApi.get(id!).then(r => r.data.data.server),
    refetchInterval: 5000,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['server-logs', id],
    queryFn: () => serverApi.logs(id!).then(r => r.data.data.logs),
    refetchInterval: activeTab === 'logs' ? 3000 : false,
    enabled: activeTab === 'logs',
  });

  const { data: qrData } = useQuery({
    queryKey: ['server-qr', id],
    queryFn: () => serverApi.qr(id!).then(r => r.data.data),
    refetchInterval: activeTab === 'qr' ? 5000 : false,
    enabled: activeTab === 'qr',
  });

  const mutOpts = (msg: string) => ({
    onSuccess: () => { toast.success(msg); queryClient.invalidateQueries({ queryKey: ['server', id] }); },
    onError: (err: any) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const startMutation = useMutation({ mutationFn: () => serverApi.start(id!), ...mutOpts('Serveur démarré') });
  const stopMutation = useMutation({ mutationFn: () => serverApi.stop(id!), ...mutOpts('Serveur arrêté') });
  const restartMutation = useMutation({ mutationFn: () => serverApi.restart(id!), ...mutOpts('Serveur redémarré') });
  const deleteMutation = useMutation({
    mutationFn: () => serverApi.delete(id!),
    onSuccess: () => { toast.success('Serveur supprimé'); navigate('/servers'); },
    onError: (err: any) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });
  const envMutation = useMutation({
    mutationFn: (vars: Record<string, string>) => serverApi.updateEnv(id!, vars),
    ...mutOpts('Variables mises à jour'),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>;
  if (!server) return <div className="text-center py-20 text-red-400 text-sm">Serveur introuvable</div>;

  const isRunning = server.status === 'running';
  const isExpired = server.expires_at && new Date(server.expires_at) < new Date();
  // BUG FIX (rev2) : état ENV unique — on initialise depuis le serveur une fois à la demande
  // puis on travaille exclusivement sur editableEnv (plus de re-fusion avec envVars à chaque render)
  const serverEnvVars: Record<string, string> = (() => {
    try { return JSON.parse(server.env_vars || '{}'); } catch { return {}; }
  })();
  // Initialise editableEnv quand l'onglet ENV est ouvert pour la première fois
  const currentEnv = editableEnv ?? serverEnvVars;

  // BUG FIX (rev2) : handler ENV utilisant useRef + editableEnv
  const handleAddEnvVar = () => {
    const k = newKeyRef.current?.value.trim() ?? '';
    const v = newValRef.current?.value ?? '';
    if (!k) { toast.error('Le nom de la variable ne peut pas être vide'); return; }
    setEditableEnv({ ...currentEnv, [k]: v });
    if (newKeyRef.current) newKeyRef.current.value = '';
    if (newValRef.current) newValRef.current.value = '';
    newKeyRef.current?.focus();
  };

  const tabs = [
    { key: 'overview', label: "Vue d'ensemble", icon: Server },
    { key: 'logs', label: 'Logs', icon: Terminal },
    { key: 'env', label: 'Variables ENV', icon: Settings },
    { key: 'qr', label: 'QR Code', icon: QrCode },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-gray-500 mb-1">// DÉTAIL SERVEUR</div>
          <div className="flex items-center gap-3">
            <span className={`status-dot ${isRunning ? 'running' : 'stopped'}`} />
            <h1 className="text-xl font-bold">{server.name}</h1>
            {isExpired && <span className="badge-error text-xs">EXPIRÉ</span>}
          </div>
          {server.description && <p className="text-xs text-gray-500 mt-1">{server.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isRunning ? (
            <button onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}
              className="btn-danger text-xs py-1.5 px-3">
              <Square className="w-3 h-3" /> Stop
            </button>
          ) : (
            <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending || !!isExpired}
              className="btn-primary text-xs py-1.5 px-3">
              <Play className="w-3 h-3" /> Start
            </button>
          )}
          <button onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}
            className="btn-secondary text-xs py-1.5 px-3">
            <RotateCcw className="w-3 h-3" /> Restart
          </button>

          {/* BUG FIX : confirmation inline au lieu de window.confirm */}
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-900 bg-opacity-20 border border-red-800 px-2 py-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400">Confirmer ?</span>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                className="btn-danger text-xs py-0.5 px-2 ml-1">
                {deleteMutation.isPending ? '...' : 'Oui, supprimer'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:text-white ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="btn-danger text-xs py-1.5 px-3">
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 flex gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap
            ${activeTab === tab.key ? 'border-green-400 text-green-400' : 'border-transparent text-gray-500 hover:text-white'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="section-title"><Server className="w-3.5 h-3.5" /> Ressources</div>
            <div className="space-y-3 text-sm">
              {[
                { icon: Server, label: 'RAM', value: `${server.ram}MB` },
                { icon: Cpu, label: 'CPU', value: `${server.cpu}%` },
                { icon: HardDrive, label: 'Disque', value: `${server.disk}MB` },
                { icon: Server, label: 'Sessions max.', value: server.max_sessions },
                { icon: Wifi, label: 'Port', value: server.port || 'N/A' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                  <div className="flex items-center gap-2 text-gray-400">
                    <item.icon className="w-3.5 h-3.5" /> {item.label}
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Clock className="w-3.5 h-3.5" /> Informations</div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Statut bot', value: <span className={server.bot_status === 'connected' ? 'text-green-400' : 'text-red-400'}>{server.bot_status || 'disconnected'}</span> },
                { label: 'Créé le', value: new Date(server.created_at).toLocaleDateString('fr-FR') },
                { label: 'Expire le', value: server.expires_at ? new Date(server.expires_at).toLocaleDateString('fr-FR') : 'N/A' },
                { label: 'Coût', value: `${server.credits_cost} crédits` },
                { label: 'Durée', value: `${server.duration_days} jours` },
                { label: 'Git', value: server.git_repo ? <span className="text-cyan-400 text-xs truncate block max-w-[150px]">{server.git_repo}</span> : 'Aucun' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="terminal-box h-96 overflow-y-auto text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-600">Aucun log disponible...</div>
          ) : (
            // BUG FIX : évite de cloner + inverser le tableau à chaque rendu (ORDER DESC côté API)
            (logs as any[]).map((log: any) => (
              <div key={log.id} className={`mb-1 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
                <span className="text-gray-600">[{new Date(log.created_at).toLocaleTimeString('fr-FR')}]</span>{' '}
                <span className="uppercase">[{log.level}]</span>{' '}
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          )}
          <div className="text-green-400 flex items-center gap-1 mt-1">
            <span>$</span><span className="cursor-blink">_</span>
          </div>
        </div>
      )}

      {/* ENV */}
      {activeTab === 'env' && (
        <div className="card space-y-4">
          <div className="section-title"><Settings className="w-3.5 h-3.5" /> Variables d&apos;environnement</div>
          <div className="space-y-2">
            {/* BUG FIX (rev2) : on travaille sur currentEnv (état unique) — pas de re-fusion */}
            {Object.entries(currentEnv).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <input type="text" value={k} readOnly className="input-field w-40 text-cyan-400" />
                <input type="text" value={v as string}
                  onChange={e => setEditableEnv({ ...currentEnv, [k]: e.target.value })}
                  className="input-field flex-1" />
                <button type="button" onClick={() => {
                  const updated = { ...currentEnv };
                  delete updated[k];
                  setEditableEnv(updated);
                }} className="text-gray-600 hover:text-red-400 px-2 transition-colors" title="Supprimer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {/* BUG FIX : useRef au lieu de document.getElementById */}
            <div className="flex gap-2 pt-2 border-t border-gray-700">
              <input ref={newKeyRef} type="text" className="input-field w-40" placeholder="VARIABLE"
                onKeyDown={e => e.key === 'Enter' && newValRef.current?.focus()} />
              <input ref={newValRef} type="text" className="input-field flex-1" placeholder="valeur"
                onKeyDown={e => e.key === 'Enter' && handleAddEnvVar()} />
              <button type="button" onClick={handleAddEnvVar} className="btn-secondary text-xs px-3">+ Ajouter</button>
            </div>
          </div>
          <button onClick={() => envMutation.mutate(currentEnv)} disabled={envMutation.isPending}
            className="btn-primary text-sm">
            {envMutation.isPending ? 'Sauvegarde...' : '> Sauvegarder les variables'}
          </button>
        </div>
      )}

      {/* QR */}
      {activeTab === 'qr' && (
        <div className="card text-center py-8">
          <div className="section-title justify-center"><QrCode className="w-3.5 h-3.5" /> Connexion WhatsApp</div>
          <div className="mb-4">
            <span className="text-xs text-gray-500">Statut : </span>
            {qrData?.botStatus === 'connected' ? (
              <span className="text-green-400 text-xs flex items-center gap-1 justify-center">
                <Wifi className="w-3.5 h-3.5" /> Connecté
              </span>
            ) : (
              <span className="text-red-400 text-xs flex items-center gap-1 justify-center">
                <WifiOff className="w-3.5 h-3.5" /> Déconnecté
              </span>
            )}
          </div>
          {qrData?.qrCode ? (
            <div className="inline-block bg-white p-4 mx-auto">
              <img src={qrData.qrCode} alt="QR Code WhatsApp" className="w-48 h-48 object-contain" />
            </div>
          ) : (
            <div className="py-8 text-gray-600 text-xs">
              {isRunning
                ? 'QR Code en cours de génération... Démarrez votre bot WhatsApp.'
                : 'Démarrez le serveur pour générer le QR Code.'}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4">Scannez avec WhatsApp pour connecter votre bot.</p>
        </div>
      )}
    </div>
  );
}
