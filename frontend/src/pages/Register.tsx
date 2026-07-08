import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, User, Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const passwordRules = [
    { label: '8 caractères minimum', ok: form.password.length >= 8 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(form.password) },
    { label: 'Une minuscule', ok: /[a-z]/.test(form.password) },
    { label: 'Un chiffre', ok: /\d/.test(form.password) },
    { label: 'Mots de passe identiques', ok: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register({ username: form.username, email: form.email, password: form.password });
      if (data.success) {
        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        toast.success(`Bienvenue, ${data.data.user.username} !`);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur lors de l\'inscription';
      toast.error(msg || 'Erreur interne');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-grid flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-400 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="text-green-400 font-bold text-lg glitch">KATASHIE BOT</span>
          </Link>
          <div className="text-xs text-gray-500 tracking-widest mb-2">// CRÉATION DE COMPTE</div>
          <h1 className="text-xl font-bold">Rejoindre la plateforme</h1>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-6 pb-3 border-b border-gray-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="ml-2">session@katashie — register</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="input-field pl-9" placeholder="john_doe" required />
              </div>
            </div>
            <div>
              <label className="label">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-9" placeholder="john@exemple.com" required />
              </div>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-9 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="input-field" placeholder="••••••••" required />
            </div>

            {/* Password rules */}
            {form.password.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 p-3 space-y-1">
                {passwordRules.map((r) => (
                  <div key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-green-400' : 'text-gray-600'}`}>
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading || !passwordRules.every(r => r.ok)}
              className="btn-primary w-full justify-center py-3 mt-2 text-sm">
              {loading ? <span className="flex items-center gap-2"><span className="spinner w-4 h-4" /> Création...</span> : '> Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            Déjà un compte ? <Link to="/login" className="text-green-400 hover:underline">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
