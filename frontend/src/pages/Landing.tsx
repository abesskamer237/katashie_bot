import { Link } from 'react-router-dom';
import { Terminal, Zap, Shield, Server, ChevronRight, Activity, Code2, Globe } from 'lucide-react';
import { useEffect, useRef } from 'react';

const features = [
  { icon: Server, title: 'Déploiement instantané', desc: 'Créez et déployez vos bots WhatsApp en quelques clics. Aucune compétence serveur requise.' },
  { icon: Shield, title: 'Sécurité maximale', desc: 'JWT, chiffrement bcrypt, rate limiting, protection CSRF/XSS. Votre sécurité est notre priorité.' },
  { icon: Activity, title: 'Monitoring temps réel', desc: 'Surveillez vos bots en temps réel : logs, QR Code, statut de connexion, consommation.' },
  { icon: Code2, title: 'Personnalisable', desc: 'Variables d\'environnement, dépôt Git, configuration avancée. Votre bot, vos règles.' },
  { icon: Zap, title: 'Système de crédits', desc: 'Rechargez vos crédits simplement via WhatsApp. Tarification transparente et flexible.' },
  { icon: Globe, title: 'Multi-sessions', desc: 'Gérez plusieurs bots depuis un seul tableau de bord. Idéal pour les agences.' },
];

export function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix rain animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const chars = '01アイウエオカキクケコサシスセソKATASHIEBOT';
    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 40);
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950 bg-opacity-90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-400 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-black" />
            </div>
            <span className="text-green-400 font-bold text-sm glitch">KATASHIE BOT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1">
              Connexion
            </Link>
            <Link to="/register" className="btn-primary text-xs py-1.5 px-4">
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-slide-up">
          {/* Terminal badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-green-400 border-opacity-40 text-green-400 text-xs mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            SYSTÈME OPÉRATIONNEL — v1.0.0
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="text-white">Gérez vos bots</span>
            <br />
            <span className="text-green-400 glitch">WhatsApp</span>
            <br />
            <span className="text-white">comme un pro.</span>
          </h1>

          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            Plateforme SaaS professionnelle pour créer, déployer et administrer vos bots WhatsApp.
            Interface hacker moderne, système de crédits intégré, déploiement en un clic.
          </p>

          {/* Terminal demo */}
          <div className="bg-black border border-gray-700 text-left max-w-lg mx-auto mb-10 p-4 text-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 ml-2">bash — katashie@server</span>
            </div>
            <div className="space-y-1 text-green-400">
              <div><span className="text-gray-600">$</span> katashie create-bot --name="MonBot" --sessions=5</div>
              <div className="text-gray-400">→ Calcul du coût : <span className="text-yellow-400">25 crédits</span></div>
              <div className="text-gray-400">→ Déduction du solde...</div>
              <div className="text-green-400">✓ Bot déployé avec succès sur le port 42847</div>
              <div className="text-gray-400">→ Scan QR Code pour connecter WhatsApp</div>
              <div className="flex items-center gap-1 text-green-400">
                <span>→ Statut :</span>
                <span className="status-dot running inline-block" />
                <span>CONNECTED</span>
                <span className="cursor-blink">_</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-sm">
              Créer un compte gratuit <ChevronRight className="w-4 h-4 inline" />
            </Link>
            <a href="https://wa.me/237682229367" target="_blank" rel="noopener noreferrer"
              className="btn-secondary px-8 py-3 text-sm">
              Contacter le support
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs text-green-400 tracking-widest mb-2">// FONCTIONNALITÉS</div>
            <h2 className="text-2xl md:text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card group hover:border-green-400 hover:border-opacity-40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-700 border border-green-400 border-opacity-30 flex items-center justify-center flex-shrink-0 group-hover:bg-green-400 group-hover:bg-opacity-10 transition-colors">
                    <f.icon className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-xs text-green-400 tracking-widest mb-2">// TARIFICATION</div>
            <h2 className="text-2xl md:text-3xl font-bold">Simple et transparent</h2>
            <p className="text-gray-500 text-sm mt-2">Rechargez via WhatsApp — Validation manuelle garantie</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Starter', credits: 15, price: 500, duration: '2 semaines', popular: false },
              { name: 'Basic', credits: 30, price: 900, duration: '1 mois', popular: false },
              { name: 'Pro', credits: 50, price: 1500, duration: '1 mois', popular: true },
              { name: 'Business', credits: 100, price: 2500, duration: '1 mois', popular: false },
            ].map((p) => (
              <div key={p.name} className={`card relative ${p.popular ? 'border-green-400 border-glow-green' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-400 text-black text-xs px-3 py-0.5 font-bold">
                    POPULAIRE
                  </div>
                )}
                <div className="text-xs text-gray-500 mb-2">{p.name}</div>
                <div className="text-2xl font-bold text-green-400 mb-1">{p.credits} <span className="text-sm text-gray-400">cr.</span></div>
                <div className="text-lg font-bold text-white mb-1">{p.price} <span className="text-xs text-gray-500">FCFA</span></div>
                <div className="text-xs text-gray-600 mb-4">{p.duration}</div>
                <Link to="/register" className="btn-primary w-full text-center text-xs py-2 justify-center">
                  Acheter →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-950 border-t border-gray-800">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-3xl font-bold mb-4">Prêt à démarrer ?</div>
          <p className="text-gray-500 text-sm mb-8">Créez votre compte en 30 secondes. Aucune carte bancaire requise.</p>
          <Link to="/register" className="btn-primary px-10 py-3 text-sm">
            Créer mon compte gratuitement →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-bold">KATASHIE BOT</span>
          </div>
          <div className="text-xs text-gray-600">
            © 2025 KATASHIE BOT — Tous droits réservés
          </div>
          <a href="https://wa.me/237682229367" target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-green-400 transition-colors">
            Support WhatsApp →
          </a>
        </div>
      </footer>
    </div>
  );
}
