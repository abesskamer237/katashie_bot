import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './init';
import { config } from '../config';
import { logger } from '../utils/logger';

async function seed() {
  const db = getDb();
  logger.info('Démarrage du seed initial...');

  // --- Admin par défaut ---
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(config.admin.email);
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(config.admin.password, 12);
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, email, password, role, credits, is_active, is_verified)
      VALUES (?, ?, ?, ?, 'admin', 9999, 1, 1)
    `).run(adminId, config.admin.username, config.admin.email, hashedPassword);
    logger.info(`Admin créé : ${config.admin.email}`);
  }

  // --- Packs de crédits par défaut ---
  const packCount = db.prepare('SELECT COUNT(*) as count FROM credit_packs').get() as { count: number };
  if (packCount.count === 0) {
    const packs = [
      { id: uuidv4(), name: 'Starter', credits: 15, price: 500, duration_days: 14, description: 'Idéal pour débuter — 1 bot pendant 2 semaines', sort_order: 1 },
      { id: uuidv4(), name: 'Basic', credits: 30, price: 900, duration_days: 30, description: 'Pour les utilisateurs réguliers — 2 bots pendant 1 mois', sort_order: 2 },
      { id: uuidv4(), name: 'Pro', credits: 50, price: 1500, duration_days: 30, description: 'Pour les professionnels — jusqu\'à 4 bots actifs', sort_order: 3 },
      { id: uuidv4(), name: 'Business', credits: 100, price: 2500, duration_days: 30, description: 'Pour les entreprises — bots illimités', sort_order: 4 },
    ];

    const insert = db.prepare(`
      INSERT INTO credit_packs (id, name, credits, price, duration_days, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pack of packs) {
      insert.run(pack.id, pack.name, pack.credits, pack.price, pack.duration_days, pack.description, pack.sort_order);
    }
    logger.info(`${packs.length} packs de crédits créés`);
  }

  // --- Annonce de bienvenue ---
  const announceCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get() as { count: number };
  if (announceCount.count === 0) {
    const adminUser = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: string };
    if (adminUser) {
      db.prepare(`
        INSERT INTO announcements (id, title, content, type, is_active, created_by)
        VALUES (?, ?, ?, 'success', 1, ?)
      `).run(
        uuidv4(),
        'Bienvenue sur KATASHIE BOT !',
        'La plateforme est désormais opérationnelle. Créez votre premier bot WhatsApp dès maintenant en achetant des crédits.',
        adminUser.id
      );
    }
  }

  logger.info('Seed terminé avec succès !');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Erreur lors du seed :', err);
  process.exit(1);
});
