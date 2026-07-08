import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Pack {
  id: string; name: string; credits: number; price: number;
  duration_days: number; description: string; is_active: number; sort_order: number;
}

// BUG FIX : helper qui parse un int de façon sûre (évite NaN envoyé à l'API)
const safeInt = (val: string, fallback = 0): number => {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
};

export function AdminPacksPage() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Pack>>({});
  const [newPack, setNewPack] = useState({ name: '', credits: 15, price: 500, durationDays: 14, description: '' });
  const [showNew, setShowNew] = useState(false);
  // BUG FIX : confirmation de suppression inline (évite window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: packs = [], isLoading } = useQuery({
    queryKey: ['admin-packs'],
    queryFn: () => adminApi.packs().then(r => r.data.data.packs),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPack(newPack),
    onSuccess: () => {
      toast.success('Pack créé');
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
      setShowNew(false);
      setNewPack({ name: '', credits: 15, price: 500, durationDays: 14, description: '' });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pack> }) => adminApi.updatePack(id, data),
    onSuccess: () => {
      toast.success('Pack mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
      setEditId(null);
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePack(id),
    onSuccess: () => {
      toast.success('Pack supprimé');
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-packs'] });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const isNewPackValid = newPack.name.trim().length >= 2 && newPack.credits > 0 && newPack.price > 0 && newPack.durationDays > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-yellow-400 mb-1">// ADMIN</div>
          <h1 className="text-xl font-bold">Packs de crédits</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nouveau pack
        </button>
      </div>

      {showNew && (
        <div className="card border-green-400 border-opacity-30">
          <div className="section-title">Créer un nouveau pack</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Nom</label>
              <input type="text" value={newPack.name}
                onChange={e => setNewPack({ ...newPack, name: e.target.value })}
                className="input-field" placeholder="Starter" maxLength={50} />
            </div>
            {/* BUG FIX : safeInt sur chaque champ numérique */}
            <div>
              <label className="label">Crédits</label>
              <input type="number" value={newPack.credits} min={1}
                onChange={e => setNewPack({ ...newPack, credits: safeInt(e.target.value, newPack.credits) })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Prix (FCFA)</label>
              <input type="number" value={newPack.price} min={1}
                onChange={e => setNewPack({ ...newPack, price: safeInt(e.target.value, newPack.price) })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Durée (jours)</label>
              <input type="number" value={newPack.durationDays} min={1}
                onChange={e => setNewPack({ ...newPack, durationDays: safeInt(e.target.value, newPack.durationDays) })}
                className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input type="text" value={newPack.description}
                onChange={e => setNewPack({ ...newPack, description: e.target.value })}
                className="input-field" placeholder="Description du pack..." maxLength={200} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate()}
              disabled={!isNewPackValid || createMutation.isPending}
              className="btn-primary text-sm">
              {createMutation.isPending ? 'Création...' : '> Créer'}
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary text-sm">
              <X className="w-3.5 h-3.5" /> Annuler
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Chargement<span className="cursor-blink">_</span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(packs as Pack[]).map((pack) => (
            <div key={pack.id} className={`card ${!pack.is_active ? 'opacity-50' : ''}`}>
              {editId === pack.id ? (
                <div className="space-y-3">
                  {[
                    { label: 'Nom', key: 'name', type: 'text' },
                    { label: 'Crédits', key: 'credits', type: 'number' },
                    { label: 'Prix (FCFA)', key: 'price', type: 'number' },
                    { label: 'Durée (jours)', key: 'duration_days', type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      {/* BUG FIX : safeInt pour les champs numériques en édition */}
                      <input
                        type={f.type}
                        value={(editData as any)[f.key] ?? (pack as any)[f.key]}
                        onChange={e => setEditData({
                          ...editData,
                          [f.key]: f.type === 'number' ? safeInt(e.target.value, (pack as any)[f.key]) : e.target.value,
                        })}
                        className="input-field"
                        min={f.type === 'number' ? 1 : undefined}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => updateMutation.mutate({ id: pack.id, data: editData })}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-xs">
                      <Save className="w-3 h-3" /> Sauvegarder
                    </button>
                    <button onClick={() => setEditId(null)} className="btn-secondary text-xs">
                      <X className="w-3 h-3" /> Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm">{pack.name}</div>
                      {!pack.is_active && <span className="badge-stopped text-xs">INACTIF</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditId(pack.id); setEditData({}); setConfirmDeleteId(null); }}
                        className="btn-secondary text-xs py-1 px-2">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {/* BUG FIX : confirmation inline au lieu de window.confirm */}
                      {confirmDeleteId === pack.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                          <button onClick={() => deleteMutation.mutate(pack.id)}
                            disabled={deleteMutation.isPending}
                            className="btn-danger text-xs py-1 px-2">
                            {deleteMutation.isPending ? '...' : 'Oui'}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="btn-secondary text-xs py-1 px-2">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(pack.id)}
                          className="btn-danger text-xs py-1 px-2">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div><span className="text-yellow-400 font-bold text-lg">{pack.credits}</span> <span className="text-gray-500 text-xs">cr.</span></div>
                    <div><span className="font-bold">{pack.price}</span> <span className="text-gray-500 text-xs">FCFA</span></div>
                    <div><span className="text-gray-400">{pack.duration_days}</span> <span className="text-gray-500 text-xs">jours</span></div>
                  </div>
                  {pack.description && <div className="text-xs text-gray-500 mt-2">{pack.description}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
