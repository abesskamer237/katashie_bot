import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Génère un UUID v4
 */
export const generateId = (): string => uuidv4();

/**
 * Génère un token aléatoire sécurisé
 */
export const generateToken = (length = 32): string =>
  crypto.randomBytes(length).toString('hex');

/**
 * Formate une date ISO en lisible
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Génère un identifiant unique de demande de paiement
 */
export const generatePaymentRef = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KAT-${timestamp}-${random}`;
};

/**
 * Construit le lien WhatsApp pré-rempli pour un paiement
 */
export const buildWhatsAppPaymentLink = (params: {
  adminWhatsapp: string;
  username: string;
  email: string;
  packName: string;
  credits: number;
  amount: number;
  ref: string;
}): string => {
  const { adminWhatsapp, username, email, packName, credits, amount, ref } = params;
  const now = new Date();
  const date = now.toLocaleDateString('fr-FR');
  const time = now.toLocaleTimeString('fr-FR');

  const message =
    `🤖 *KATASHIE BOT — Demande de paiement*\n\n` +
    `👤 *Utilisateur :* ${username}\n` +
    `📧 *Email :* ${email}\n` +
    `📦 *Pack :* ${packName}\n` +
    `💰 *Crédits :* ${credits} crédits\n` +
    `💵 *Montant :* ${amount} FCFA\n` +
    `📅 *Date :* ${date}\n` +
    `🕐 *Heure :* ${time}\n` +
    `🔑 *Référence :* ${ref}\n\n` +
    `✅ Merci de confirmer ce paiement.`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${adminWhatsapp}?text=${encoded}`;
};

/**
 * Sanitise une chaîne pour éviter les injections
 */
export const sanitizeString = (str: string): string =>
  str.replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' }[c] || c));

/**
 * Calcule le coût en crédits d'un serveur
 */
export const calculateServerCost = (params: {
  ram: number;       // MB
  cpu: number;       // %
  disk: number;      // MB
  maxSessions: number;
  durationDays: number;
}): number => {
  const { ram, cpu, disk, maxSessions, durationDays } = params;

  const ramScore = ram / 512;           // 1pt par 512MB RAM
  const cpuScore = cpu / 50;            // 1pt par 50% CPU
  const diskScore = disk / 1024;        // 1pt par 1GB disque
  const sessionScore = maxSessions / 2; // 1pt par 2 sessions
  const durationScore = durationDays / 7; // 1pt par semaine

  const base = (ramScore + cpuScore + diskScore + sessionScore) * durationScore;
  const cost = Math.ceil(base * 5); // Multiplier x5

  return Math.max(15, cost); // Minimum 15 crédits
};
