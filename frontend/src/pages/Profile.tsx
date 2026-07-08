import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { User, Lock, Mail, Calendar, Cpu, Activity } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const profileMutation = useMutation({
    mutationFn: () => {
      // BUG FIX : validation côté client avant envoi (évite soumission vide)
      const trimmed = username.trim();
      if (trimmed.length < 3) throw new Error('MIN_LENGTH');
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) throw new Error('INVALID_CHARS');
      return authApi.updateProfile({ username: trimmed });
    },
    onSuccess: (res) => {
      updateUser({ username: res.data.data.user.username });
      toast.success('Profil mis à jour');
    },
    onError: (err: any) => {
      if (err?.message === 'MIN_LENGTH') { toast.error('Le nom doit faire au moins 3 caractères'); return; }
      if (err?.message === 'INVALID_CHARS') { toast.error('Lettres, chiffres et _ uniquement'); return; }
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur');
    },
  });

  const pwdMutation = useMutation({
    mutationFn: () => authApi.changePassword({
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword,
    }),
    onSuccess: () => {
      toast.success('Mot de passe modifié');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur'),
  });

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }
    pwdMutation.mutate();
  };

  // BUG FIX : bouton désactivé si vide OU identique OU trop court
  const isUsernameChanged = username.trim() !== user?.username && username.trim().length >= 3;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="text-xs text-gray-500 mb-1">// MON PROFIL</div>
        <h1 className="text-xl font-bold">Paramètres du compte</h1>
      </div>

      {/* User info card */}
      <div className="card">
        <div className="section-title"><User className="w-3.5 h-3.5" /> Informations du compte</div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-800 border-2 border-green-400 flex items-center justify-center">
            <span className="text-green-400 text-2xl font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-bold text-lg">{user?.username}</div>
            <div className="text-gray-400 text-sm flex items-center gap-1">
              <Mail className="w-3 h-3" /> {user?.email}
            </div>
            <div className="mt-1">
              {user?.role === 'admin' ? (
                <span className="px-2 py-0.5 text-xs bg-yellow-900 text-yellow-400 border border-yellow-800">ADMINISTRATEUR</span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 border border-gray-600">UTILISATEUR</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-6">
          <div className="bg-gray-900 px-3 py-2 border border-gray-700">
            <div className="text-gray-500 flex items-center gap-1 mb-1"><Activity className="w-3 h-3" /> Crédits</div>
            <div className="text-yellow-400 font-bold text-lg">{user?.credits}</div>
          </div>
          <div className="bg-gray-900 px-3 py-2 border border-gray-700">
            <div className="text-gray-500 flex items-center gap-1 mb-1"><Cpu className="w-3 h-3" /> Rôle</div>
            <div className="text-white font-bold">{user?.role === 'admin' ? 'Admin' : 'Utilisateur'}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <label className="label">Nom d&apos;utilisateur</label>
          <div className="flex gap-2">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input-field flex-1" minLength={3} maxLength={30}
              placeholder="3-30 caractères, lettres/chiffres/_" />
            <button onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending || !isUsernameChanged}
              className="btn-primary text-sm px-4">
              {profileMutation.isPending ? '...' : 'Mettre à jour'}
            </button>
          </div>
          {username.trim().length > 0 && username.trim().length < 3 && (
            <p className="text-xs text-red-400 mt-1">Minimum 3 caractères requis</p>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="section-title"><Lock className="w-3.5 h-3.5" /> Changer le mot de passe</div>
        <form onSubmit={handlePwdSubmit} className="space-y-4">
          <div>
            <label className="label">Mot de passe actuel</label>
            <input type="password" value={pwdForm.currentPassword}
              onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className="input-field" placeholder="••••••••" required />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input type="password" value={pwdForm.newPassword}
              onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              className="input-field" placeholder="Min. 8 car., 1 maj., 1 min., 1 chiffre" required minLength={8} />
          </div>
          <div>
            <label className="label">Confirmer le nouveau mot de passe</label>
            <input type="password" value={pwdForm.confirm}
              onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={pwdMutation.isPending} className="btn-primary text-sm">
            {pwdMutation.isPending ? 'Modification...' : '> Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card border border-red-900 border-opacity-40">
        <div className="section-title text-red-400">
          <Calendar className="w-3.5 h-3.5 text-red-400" /> Zone de danger
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Pour supprimer votre compte ou toute autre action critique, contactez notre support.
        </p>
        <a href="https://wa.me/237682229367?text=Je%20souhaite%20supprimer%20mon%20compte%20KATASHIE%20BOT"
          target="_blank" rel="noopener noreferrer" className="btn-danger text-xs">
          Contacter le support
        </a>
      </div>
    </div>
  );
}
