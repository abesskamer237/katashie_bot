import { ExternalLink, MessageCircle, Sparkles } from 'lucide-react';

interface CreditWhatsAppCardProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export function CreditWhatsAppCard({
  title = 'Comment ça marche ?',
  description = 'Rechargez vos crédits directement par WhatsApp et continuez sans attendre.',
  compact = false,
  className = '',
}: CreditWhatsAppCardProps) {
  const whatsappUrl = 'https://wa.me/237682229367?text=Bonjour%20KATASHIE%20BOT%2C%20je%20souhaite%20recharger%20mes%20cr%C3%A9dits.';

  return (
    <div className={`rounded-none border border-gray-700 bg-gray-800/80 p-4 text-sm text-gray-400 ${className}`}>
      <div className="flex items-start gap-2 mb-3">
        <div className="mt-0.5 rounded-full border border-green-400/30 bg-green-400/10 p-2 text-green-400">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <div className="font-bold text-green-400 mb-1">{title}</div>
          <div className="text-xs text-gray-500 leading-relaxed">{description}</div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs leading-relaxed">
        <div>1. Cliquez sur “Acheter via WhatsApp” pour ouvrir un message pré-rempli.</div>
        <div>2. Envoyez-le à notre équipe sur WhatsApp (+237 682 229 367).</div>
        <div>3. Effectuez votre paiement selon les instructions reçues.</div>
        <div>4. Vos crédits sont ajoutés généralement dans les 30 minutes.</div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-4 inline-flex w-full justify-center text-xs py-2"
      >
        <Sparkles className="h-3.5 w-3.5" /> Acheter via WhatsApp
      </a>

      {!compact && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
          <ExternalLink className="h-3 w-3" />
          Ou contactez-nous directement pour un support rapide.
        </div>
      )}
    </div>
  );
}
