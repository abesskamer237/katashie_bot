import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Instructions envoyées !');
    } catch { toast.error('Erreur. Veuillez réessayer.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-400 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="text-green-400 font-bold text-lg">KATASHIE BOT</span>
          </Link>
          <div className="text-xs text-gray-500 tracking-widest mb-2">// RÉINITIALISATION</div>
          <h1 className="text-xl font-bold">Mot de passe oublié</h1>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-900 border border-green-400 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-400 font-bold mb-2">Instructions envoyées</p>
              <p className="text-gray-400 text-xs mb-6">
                Si cet e-mail existe dans notre système, vous recevrez un lien de réinitialisation.
              </p>
              <Link to="/login" className="btn-primary text-xs justify-center">
                <ArrowLeft className="w-3 h-3" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-gray-400 mb-4">Entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.</p>
              <div>
                <label className="label">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-field pl-9" placeholder="votre@email.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
                {loading ? <><span className="spinner w-4 h-4" /> Envoi...</> : '> Envoyer le lien'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white mt-2">
                <ArrowLeft className="w-3 h-3" /> Retour à la connexion
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
