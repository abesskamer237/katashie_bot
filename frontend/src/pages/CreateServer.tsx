import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serverApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Server, Cpu, HardDrive, Users, Clock, GitBranch, Zap, AlertCircle } from 'lucide-react';
import { calculateServerCost } from '../utils/helpers';
import toast from 'react-hot-toast';
import axios from 'axios';

export function CreateServerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateCredits } = useAuthStore();

  const [form, setForm] = useState({
    name: '', description: '',
    ram: 512, cpu: 50, disk: 1024, maxSessions: 1, durationDays: 14,
    gitRepo: '', gitBranch: 'main', mainFile: 'index.js',
  });

  const [estimatedCost, setEstimatedCost] = useState(15);

  useEffect(() => {
    const cost = calculateServerCost({ ram: form.ram, cpu: form.cpu, disk: form.disk, maxSessions: form.maxSessions, durationDays: form.durationDays });
    setEstimatedCost(cost);
  }, [form.ram, form.cpu, form.disk, form.maxSessions, form.durationDays]);

  const canAfford = (user?.credits || 0) >= estimatedCost;

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => serverApi.create(data),
    onSuccess: (res) => {
      toast.success('Serveur créé avec succès !');
      updateCredits(res.data.data.newBalance);
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      navigate(`/servers/${res.data.data.server.id}`);
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur de création';
      toast.error(msg || 'Erreur');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAfford) { toast.error('Crédits insuffisants'); return; }
    createMutation.mutate(form);
  };

  const ramOptions = [256, 512, 1024, 2048, 4096, 8192];
  const cpuOptions = [25, 50, 100, 150, 200];
  const diskOptions = [512, 1024, 2048, 5120, 10240, 20480];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-xs text-gray-500 mb-1">// NOUVEAU SERVEUR</div>
        <h1 className="text-xl font-bold">Créer un serveur</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Infos de base */}
        <div className="card">
          <div className="section-title"><Server className="w-3.5 h-3.5" /> Informations générales</div>
          <div className="space-y-4">
            <div>
              <label className="label">Nom du serveur *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Mon-Bot-WhatsApp" required minLength={3} maxLength={50} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-field resize-none" rows={2} placeholder="Description optionnelle..." maxLength={200} />
            </div>
          </div>
        </div>

        {/* Ressources */}
        <div className="card">
          <div className="section-title"><Cpu className="w-3.5 h-3.5" /> Ressources</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label"><Server className="w-3 h-3 inline mr-1" /> RAM</label>
              <select value={form.ram} onChange={e => setForm({ ...form, ram: parseInt(e.target.value) })} className="input-field">
                {ramOptions.map(v => <option key={v} value={v}>{v >= 1024 ? `${v/1024}GB` : `${v}MB`}</option>)}
              </select>
            </div>
            <div>
              <label className="label"><Cpu className="w-3 h-3 inline mr-1" /> CPU</label>
              <select value={form.cpu} onChange={e => setForm({ ...form, cpu: parseInt(e.target.value) })} className="input-field">
                {cpuOptions.map(v => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div>
              <label className="label"><HardDrive className="w-3 h-3 inline mr-1" /> Disque</label>
              <select value={form.disk} onChange={e => setForm({ ...form, disk: parseInt(e.target.value) })} className="input-field">
                {diskOptions.map(v => <option key={v} value={v}>{v >= 1024 ? `${v/1024}GB` : `${v}MB`}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="card">
          <div className="section-title"><Users className="w-3.5 h-3.5" /> Configuration</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label"><Users className="w-3 h-3 inline mr-1" /> Sessions max.</label>
              <input type="number" min={1} max={20} value={form.maxSessions}
                onChange={e => setForm({ ...form, maxSessions: parseInt(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="label"><Clock className="w-3 h-3 inline mr-1" /> Durée (jours)</label>
              <input type="number" min={1} max={90} value={form.durationDays}
                onChange={e => setForm({ ...form, durationDays: parseInt(e.target.value) })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Git */}
        <div className="card">
          <div className="section-title"><GitBranch className="w-3.5 h-3.5" /> Dépôt Git (optionnel)</div>
          <div className="space-y-3">
            <div>
              <label className="label">URL du dépôt</label>
              <input type="url" value={form.gitRepo} onChange={e => setForm({ ...form, gitRepo: e.target.value })}
                className="input-field" placeholder="https://github.com/user/mon-bot" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Branche</label>
                <input type="text" value={form.gitBranch} onChange={e => setForm({ ...form, gitBranch: e.target.value })}
                  className="input-field" placeholder="main" />
              </div>
              <div>
                <label className="label">Fichier principal</label>
                <input type="text" value={form.mainFile} onChange={e => setForm({ ...form, mainFile: e.target.value })}
                  className="input-field" placeholder="index.js" />
              </div>
            </div>
          </div>
        </div>

        {/* Résumé du coût */}
        <div className={`card ${canAfford ? 'border-green-400 border-opacity-30' : 'border-red-400 border-opacity-30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">COÛT ESTIMÉ</div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">{estimatedCost}</span>
                <span className="text-gray-500">crédits</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Votre solde : <span className={canAfford ? 'text-green-400' : 'text-red-400'}>{user?.credits ?? 0} crédits</span>
              </div>
            </div>
            {!canAfford && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900 bg-opacity-20 border border-red-800 px-3 py-2">
                <AlertCircle className="w-4 h-4" />
                Crédits insuffisants
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/servers')} className="btn-secondary flex-1 justify-center py-3">
            Annuler
          </button>
          <button type="submit" disabled={createMutation.isPending || !canAfford} className="btn-primary flex-1 justify-center py-3">
            {createMutation.isPending ? <><span className="spinner w-4 h-4" /> Création...</> : `> Créer (${estimatedCost} cr.)`}
          </button>
        </div>
      </form>
    </div>
  );
}
