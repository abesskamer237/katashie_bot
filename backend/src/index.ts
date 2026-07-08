import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { logger } from './utils/logger';
import { initDatabase } from './database/init';
import { globalLimiter } from './middleware/rateLimit';
import { httpLogger } from './middleware/logger';

// Routes
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import creditRoutes from './routes/credits';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import announcementRoutes from './routes/announcements';

const app = express();

// ─── Trust proxy (IP correcte derrière Nginx) ─────────────
// OBLIGATOIRE pour que express-rate-limit lise la vraie IP via X-Forwarded-For
// sans ça, toutes les requêtes semblent venir de 127.0.0.1
app.set('trust proxy', 1);

// ─── Sécurité ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: config.env === 'development' ? true : config.appUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Middlewares généraux ──────────────────────────────────
app.use(compression());
app.use(cookieParser(config.session.secret));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(httpLogger);
app.use(globalLimiter);

// ─── Dossiers statiques ───────────────────────────────────
if (!fs.existsSync(config.upload.dir)) fs.mkdirSync(config.upload.dir, { recursive: true });
app.use('/uploads', express.static(config.upload.dir));

// ─── Routes API ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);

// ─── Health check ──────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: config.appName,
    version: '1.0.0',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 API ──────────────────────────────────────────────
// BUG FIX : doit être placé AVANT le catch-all SPA pour intercepter
// les routes /api/... inconnues avec une vraie réponse 404 JSON.
// Couvre à la fois /api (sans slash) et /api/* (avec sous-chemin).
app.use(['/api', '/api/*'], (_req, res) => {
  res.status(404).json({ success: false, message: 'Route API introuvable' });
});

// ─── Servir le frontend React (production) ────────────────
// Ce catch-all doit venir APRÈS les routes API pour ne pas les écraser.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA : toutes les routes non-API renvoient index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ success: true, message: `${config.appName} API — v1.0.0` });
  });
}

// ─── Gestionnaire d'erreurs global ────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erreur non gérée:', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

// ─── Démarrage ────────────────────────────────────────────
async function start() {
  try {
    initDatabase();
    app.listen(config.port, () => {
      logger.info(`╔══════════════════════════════════════════╗`);
      logger.info(`║         KATASHIE BOT — API Server        ║`);
      logger.info(`║  Port: ${config.port}   Env: ${config.env.padEnd(12)}      ║`);
      logger.info(`╚══════════════════════════════════════════╝`);
    });
  } catch (err) {
    logger.error('Erreur au démarrage:', err);
    process.exit(1);
  }
}

start();

export default app;
