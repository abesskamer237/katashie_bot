import dotenv from 'dotenv';
import path from 'path';
import { SignOptions } from 'jsonwebtoken';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Fail fast on missing critical secrets ──────────────────────────────────
const REQUIRED_SECRETS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
const isProd = process.env.NODE_ENV === 'production';

for (const key of REQUIRED_SECRETS) {
  if (!process.env[key]) {
    if (isProd) {
      console.error(`[CONFIG] FATAL: Variable d'environnement manquante : ${key}`);
      process.exit(1);
    } else {
      console.warn(`[CONFIG] ATTENTION: ${key} non défini — valeur par défaut utilisée (développement uniquement).`);
    }
  }
}

if (isProd && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
  console.error('[CONFIG] FATAL: ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis en production.');
  process.exit(1);
}

// Valeurs par défaut uniquement pour le développement local
const DEV_JWT_SECRET = 'dev_jwt_secret_64chars_DO_NOT_USE_IN_PRODUCTION_xxxxxxxxxxxxxxxxxxx';
const DEV_REFRESH_SECRET = 'dev_refresh_secret_64chars_DO_NOT_USE_IN_PRODUCTION_xxxxxxxxxxxxxxxxxx';
const DEV_SESSION_SECRET = 'dev_session_secret_32chars_DO_NOT_USE_xx';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'KATASHIE BOT',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  db: {
    path: process.env.DB_PATH || path.resolve(__dirname, '../../database/katashie.db'),
  },

  jwt: {
    secret: process.env.JWT_SECRET || DEV_JWT_SECRET,
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    refreshSecret: process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'],
  },

  session: {
    secret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'KATASHIE BOT <noreply@katashie.com>',
  },

  admin: {
    whatsapp: process.env.ADMIN_WHATSAPP || '237682229367',
    email: process.env.ADMIN_EMAIL || 'admin@katashie.com',
    // Pas de mot de passe par défaut en production (fail-fast ci-dessus)
    password: process.env.ADMIN_PASSWORD || (isProd ? '' : 'DevAdmin@123'),
    username: process.env.ADMIN_USERNAME || 'admin',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    loginMax: parseInt(process.env.LOGIN_LIMIT_MAX || '5', 10),
  },

  logs: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.resolve(__dirname, '../../../logs'),
  },

  upload: {
    dir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../uploads'),
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },

  credits: {
    minForServer: parseInt(process.env.MIN_CREDITS_FOR_SERVER || '15', 10),
  },
} as const;