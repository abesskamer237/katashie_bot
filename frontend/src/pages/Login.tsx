import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      if (data.success) {
        login(data.data.user, data.data.accessToken, data.data.refreshToken);
        toast.success(`Bienvenue, ${data.data.user.username} !`);
        navigate(data.data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur de connexion';
      toast.error(msg || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-400 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="text-green-400 font-bold text-lg glitch">KATASHIE BOT</span>
          </Link>
          <div className="text-xs text-gray-500 tracking-widest mb-2">// AUTHENTIFICATION</div>
          <h1 className="text-xl font-bold">Connexion au panel</h1>
        </div>

        {/* Form */}
        <div className="card border-glow-green">
          {/* Terminal header */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-6 pb-3 border-b border-gray-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="ml-2">session@katashie — login</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-9" placeholder="admin@exemple.com" required
                />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-9 pr-10" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-green-400 transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" /> Connexion en cours...
                </span>
              ) : (
                '> Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-green-400 hover:underline">Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
