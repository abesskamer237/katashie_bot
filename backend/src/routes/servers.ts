import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/init';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { actionLimiter } from '../middleware/rateLimit';
import { logAction } from '../middleware/logger';
import { calculateServerCost } from '../utils/helpers';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/servers — Liste des serveurs de l'utilisateur
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const servers = db.prepare('SELECT * FROM servers WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  res.json({ success: true, data: { servers } });
});

// GET /api/servers/:id — Détail d'un serveur
router.get('/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!server) {
    res.status(404).json({ success: false, message: 'Serveur introuvable' });
    return;
  }
  res.json({ success: true, data: { server } });
});

// POST /api/servers/calculate — Calcul du coût avant création
router.post('/calculate',
  [
    body('ram').isInt({ min: 256, max: 8192 }),
    body('cpu').isInt({ min: 10, max: 200 }),
    body('disk').isInt({ min: 512, max: 20480 }),
    body('maxSessions').isInt({ min: 1, max: 20 }),
    body('durationDays').isInt({ min: 1, max: 90 }),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    const { ram, cpu, disk, maxSessions, durationDays } = req.body;
    const cost = calculateServerCost({ ram, cpu, disk, maxSessions, durationDays });
    res.json({ success: true, data: { cost, canAfford: req.user!.credits >= cost } });
  }
);

// POST /api/servers — Créer un serveur
router.post('/',
  actionLimiter,
  [
    body('name').trim().isLength({ min: 3, max: 50 }).withMessage('Nom : 3-50 caractères'),
    body('description').optional().trim().isLength({ max: 200 }),
    body('ram').isInt({ min: 256, max: 8192 }),
    body('cpu').isInt({ min: 10, max: 200 }),
    body('disk').isInt({ min: 512, max: 20480 }),
    body('maxSessions').isInt({ min: 1, max: 20 }),
    body('durationDays').isInt({ min: 1, max: 90 }),
    body('gitRepo').optional().isURL(),
    body('gitBranch').optional().isString(),
    body('mainFile').optional().isString(),
  ],
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const { name, description, ram, cpu, disk, maxSessions, durationDays, gitRepo, gitBranch, mainFile } = req.body;
      const db = getDb();

      const cost = calculateServerCost({ ram, cpu, disk, maxSessions, durationDays });

      // Vérification du solde AVANT la transaction
      const userRow = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as any;
      if (userRow.credits < cost) {
        res.status(402).json({
          success: false,
          message: `Crédits insuffisants. Coût : ${cost} crédits. Votre solde : ${userRow.credits} crédits.`,
          data: { required: cost, balance: userRow.credits },
        });
        return;
      }

      // Transaction atomique : débit + création serveur + logs en une seule opération
      const createServer = db.transaction(() => {
        // Re-lire le solde dans la transaction pour éviter les race conditions
        const freshUser = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as any;
        if (freshUser.credits < cost) {
          throw new Error(`INSUFFICIENT_CREDITS:${freshUser.credits}`);
        }

        const serverId = uuidv4();
        const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
        const port = 40000 + Math.floor(Math.random() * 20000);
        const newBalance = freshUser.credits - cost;

        // 1. Déduire les crédits
        db.prepare('UPDATE users SET credits = ?, updated_at = datetime("now") WHERE id = ?').run(newBalance, req.user!.id);

        // 2. Enregistrer la transaction de crédit
        db.prepare(`
          INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, ref)
          VALUES (?, ?, 'debit', ?, ?, ?, ?, ?)
        `).run(uuidv4(), req.user!.id, cost, freshUser.credits, newBalance, `Création serveur: ${name}`, serverId);

        // 3. Créer le serveur
        db.prepare(`
          INSERT INTO servers (id, user_id, name, description, status, ram, cpu, disk, max_sessions, credits_cost, duration_days, expires_at, git_repo, git_branch, main_file, port)
          VALUES (?, ?, ?, ?, 'stopped', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(serverId, req.user!.id, name, description || null, ram, cpu, disk, maxSessions, cost, durationDays, expiresAt, gitRepo || null, gitBranch || 'main', mainFile || 'index.js', port);

        // 4. Log bot initial
        db.prepare(`
          INSERT INTO bot_logs (id, server_id, user_id, level, message) VALUES (?, ?, ?, 'info', ?)
        `).run(uuidv4(), serverId, req.user!.id, `Serveur "${name}" créé avec succès. Démarrez-le pour commencer.`);

        return { serverId, newBalance };
      });

      const { serverId, newBalance } = createServer();
      logAction({ userId: req.user!.id, action: 'SERVER_CREATE', entity: 'server', entityId: serverId, details: `${name} — ${cost} crédits`, ip: req.ip });
      const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId);
      logger.info(`Serveur créé : ${serverId} par ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: `Serveur "${name}" créé avec succès. ${cost} crédits déduits.`,
        data: { server, newBalance },
      });
    } catch (err: any) {
      if (err?.message?.startsWith('INSUFFICIENT_CREDITS:')) {
        const balance = parseInt(err.message.split(':')[1]);
        res.status(402).json({ success: false, message: `Crédits insuffisants. Votre solde : ${balance} crédits.` });
        return;
      }
      logger.error('Erreur création serveur:', err);
      res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
);

// POST /api/servers/:id/start
router.post('/:id/start', actionLimiter, param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }
  if (server.status === 'running') { res.status(400).json({ success: false, message: 'Serveur déjà en cours d\'exécution' }); return; }

  db.prepare('UPDATE servers SET status = "running", updated_at = datetime("now") WHERE id = ?').run(server.id);
  db.prepare(`INSERT INTO bot_logs (id, server_id, user_id, level, message) VALUES (?, ?, ?, 'info', ?)`).run(uuidv4(), server.id, req.user!.id, `Serveur démarré.`);
  logAction({ userId: req.user!.id, action: 'SERVER_START', entity: 'server', entityId: server.id, ip: req.ip });
  res.json({ success: true, message: 'Serveur démarré' });
});

// POST /api/servers/:id/stop
router.post('/:id/stop', actionLimiter, param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

  db.prepare('UPDATE servers SET status = "stopped", bot_status = "disconnected", process_id = NULL, updated_at = datetime("now") WHERE id = ?').run(server.id);
  db.prepare(`INSERT INTO bot_logs (id, server_id, user_id, level, message) VALUES (?, ?, ?, 'warn', ?)`).run(uuidv4(), server.id, req.user!.id, `Serveur arrêté.`);
  logAction({ userId: req.user!.id, action: 'SERVER_STOP', entity: 'server', entityId: server.id, ip: req.ip });
  res.json({ success: true, message: 'Serveur arrêté' });
});

// POST /api/servers/:id/restart
router.post('/:id/restart', actionLimiter, param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

  db.prepare('UPDATE servers SET status = "running", updated_at = datetime("now") WHERE id = ?').run(server.id);
  db.prepare(`INSERT INTO bot_logs (id, server_id, user_id, level, message) VALUES (?, ?, ?, 'info', ?)`).run(uuidv4(), server.id, req.user!.id, `Serveur redémarré.`);
  logAction({ userId: req.user!.id, action: 'SERVER_RESTART', entity: 'server', entityId: server.id, ip: req.ip });
  res.json({ success: true, message: 'Serveur redémarré' });
});

// DELETE /api/servers/:id
router.delete('/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

  db.prepare('DELETE FROM servers WHERE id = ?').run(server.id);
  logAction({ userId: req.user!.id, action: 'SERVER_DELETE', entity: 'server', entityId: server.id, details: server.name, ip: req.ip });
  res.json({ success: true, message: 'Serveur supprimé' });
});

// GET /api/servers/:id/logs
router.get('/:id/logs', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT id FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

  const logs = db.prepare('SELECT * FROM bot_logs WHERE server_id = ? ORDER BY created_at DESC LIMIT 200').all(req.params.id);
  res.json({ success: true, data: { logs } });
});

// PUT /api/servers/:id/env
router.put('/:id/env',
  param('id').isUUID(),
  body('envVars').isObject(),
  validate,
  (req: AuthRequest, res: Response) => {
    const db = getDb();
    const server = db.prepare('SELECT id FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
    if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

    db.prepare('UPDATE servers SET env_vars = ?, updated_at = datetime("now") WHERE id = ?')
      .run(JSON.stringify(req.body.envVars), req.params.id);
    logAction({ userId: req.user!.id, action: 'SERVER_ENV_UPDATE', entity: 'server', entityId: req.params.id, ip: req.ip });
    res.json({ success: true, message: 'Variables d\'environnement mises à jour' });
  }
);

// GET /api/servers/:id/qr
router.get('/:id/qr', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT id, qr_code, bot_status FROM servers WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }

  res.json({ success: true, data: { qrCode: server.qr_code, botStatus: server.bot_status } });
});

export default router;
