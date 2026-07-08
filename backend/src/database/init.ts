import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Initialise la base de données SQLite et crée les tables
 */
export function initDatabase(): Database.Database {
  const dbDir = path.dirname(config.db.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(config.db.path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- Utilisateurs
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      credits INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_verified INTEGER NOT NULL DEFAULT 0,
      reset_token TEXT,
      reset_token_expires TEXT,
      last_login TEXT,
      last_ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Serveurs / Bots
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'stopped',
      ram INTEGER NOT NULL DEFAULT 512,
      cpu INTEGER NOT NULL DEFAULT 50,
      disk INTEGER NOT NULL DEFAULT 1024,
      max_sessions INTEGER NOT NULL DEFAULT 1,
      credits_cost INTEGER NOT NULL DEFAULT 15,
      duration_days INTEGER NOT NULL DEFAULT 14,
      expires_at TEXT,
      git_repo TEXT,
      git_branch TEXT DEFAULT 'main',
      main_file TEXT DEFAULT 'index.js',
      env_vars TEXT DEFAULT '{}',
      port INTEGER,
      qr_code TEXT,
      bot_status TEXT DEFAULT 'disconnected',
      process_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Logs des bots
    CREATE TABLE IF NOT EXISTS bot_logs (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    -- Packs de crédits
    CREATE TABLE IF NOT EXISTS credit_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      price INTEGER NOT NULL,
      duration_days INTEGER NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Transactions / historique crédits
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT,
      ref TEXT,
      admin_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Demandes de paiement
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      ref TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      credits INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      whatsapp_link TEXT,
      processed_by TEXT,
      processed_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Logs système
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      details TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      is_global INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Annonces
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Index de performance
    CREATE INDEX IF NOT EXISTS idx_servers_user_id ON servers(user_id);
    CREATE INDEX IF NOT EXISTS idx_bot_logs_server_id ON bot_logs(server_id);
    CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);

  logger.info('Base de données initialisée avec succès');
  return db;
}

// Singleton de connexion DB
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = initDatabase();
  }
  return _db;
}
