import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/init';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logAction } from '../middleware/logger';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const users = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get() as any).count;
  const activeServers = (db.prepare('SELECT COUNT(*) as count FROM servers WHERE status = "running"').get() as any).count;
  const totalServers = (db.prepare('SELECT COUNT(*) as count FROM servers').get() as any).count;
  const pendingPayments = (db.prepare('SELECT COUNT(*) as count FROM payment_requests WHERE status = "pending"').get() as any).count;
  const totalCreditsDistributed = (db.prepare('SELECT COALESCE(SUM(amount),0) as sum FROM credit_transactions WHERE type = "credit"').get() as any).sum;
  res.json({ success: true, data: { users, activeServers, totalServers, pendingPayments, totalCreditsDistributed } });
});

// GET /api/admin/users
router.get('/users', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let query = 'SELECT id, username, email, role, credits, is_active, last_login, created_at FROM users';
  let countQuery = 'SELECT COUNT(*) as count FROM users';
  const params: any[] = [];

  if (search) {
    query += ' WHERE username LIKE ? OR email LIKE ?';
    countQuery += ' WHERE username LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(countQuery).get(...params) as any).count;
  const users = db.prepare(query).all(...params, limit, offset);
  res.json({ success: true, data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// GET /api/admin/users/:id
router.get('/users/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, credits, is_active, last_login, last_ip, created_at FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) { res.status(404).json({ success: false, message: 'Utilisateur introuvable' }); return; }
  const servers = db.prepare('SELECT id, name, status, credits_cost, expires_at, created_at FROM servers WHERE user_id = ?').all(req.params.id);
  const transactions = db.prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.params.id);
  res.json({ success: true, data: { user, servers, transactions } });
});

// POST /api/admin/users/:id/credits
router.post('/users/:id/credits',
  param('id').isUUID(),
  body('amount').isInt({ min: -10000, max: 10000 }).withMessage('Montant invalide'),
  body('reason').optional().isString().isLength({ max: 200 }),
  validate,
  (req: AuthRequest, res: Response) => {
    const { amount, reason } = req.body;
    const db = getDb();

    // Transaction atomique pour éviter les écritures concurrentes incohérentes
    const adjustCredits = db.transaction(() => {
      const user = db.prepare('SELECT id, username, credits FROM users WHERE id = ?').get(req.params.id) as any;
      if (!user) return null;
      const newBalance = Math.max(0, user.credits + amount);
      db.prepare('UPDATE users SET credits = ?, updated_at = datetime("now") WHERE id = ?').run(newBalance, user.id);
      db.prepare(`
        INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, admin_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), user.id, amount > 0 ? 'credit' : 'debit', Math.abs(amount), user.credits, newBalance,
        reason || `Ajustement admin — ${amount > 0 ? '+' : ''}${amount} crédits`, req.user!.id);
      return { user, newBalance };
    });

    const result = adjustCredits();
    if (!result) { res.status(404).json({ success: false, message: 'Utilisateur introuvable' }); return; }

    logAction({ userId: req.user!.id, action: amount > 0 ? 'ADMIN_ADD_CREDITS' : 'ADMIN_REMOVE_CREDITS', entity: 'user', entityId: result.user.id, details: `${amount > 0 ? '+' : ''}${amount} crédits — Raison: ${reason || 'N/A'}`, ip: req.ip });
    logger.info(`Admin ${req.user!.email} : ${amount > 0 ? '+' : ''}${amount} crédits → ${result.user.email}`);
    res.json({ success: true, message: `${Math.abs(amount)} crédits ${amount > 0 ? 'ajoutés' : 'retirés'}`, data: { newBalance: result.newBalance } });
  }
);

// POST /api/admin/users/:id/toggle
router.post('/users/:id/toggle', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, is_active, email FROM users WHERE id = ? AND role != "admin"').get(req.params.id) as any;
  if (!user) { res.status(404).json({ success: false, message: 'Utilisateur introuvable' }); return; }
  const newStatus = user.is_active ? 0 : 1;
  db.prepare('UPDATE users SET is_active = ?, updated_at = datetime("now") WHERE id = ?').run(newStatus, user.id);
  logAction({ userId: req.user!.id, action: newStatus ? 'ADMIN_UNBLOCK_USER' : 'ADMIN_BLOCK_USER', entity: 'user', entityId: user.id, ip: req.ip });
  res.json({ success: true, message: `Compte ${newStatus ? 'activé' : 'désactivé'}`, data: { is_active: newStatus } });
});

// GET /api/admin/servers
router.get('/servers', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const total = (db.prepare('SELECT COUNT(*) as count FROM servers').get() as any).count;
  const servers = db.prepare(`
    SELECT s.*, u.username, u.email FROM servers s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  res.json({ success: true, data: { servers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// DELETE /api/admin/servers/:id
router.delete('/servers/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id) as any;
  if (!server) { res.status(404).json({ success: false, message: 'Serveur introuvable' }); return; }
  db.prepare('DELETE FROM servers WHERE id = ?').run(server.id);
  logAction({ userId: req.user!.id, action: 'ADMIN_DELETE_SERVER', entity: 'server', entityId: server.id, details: server.name, ip: req.ip });
  res.json({ success: true, message: 'Serveur supprimé' });
});

// GET /api/admin/payments
router.get('/payments', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  let query = `SELECT pr.*, u.username, u.email, cp.name as pack_name FROM payment_requests pr LEFT JOIN users u ON pr.user_id = u.id LEFT JOIN credit_packs cp ON pr.pack_id = cp.id`;
  const params: any[] = [];
  if (status) { query += ' WHERE pr.status = ?'; params.push(status); }
  query += ' ORDER BY pr.created_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM payment_requests${status ? ' WHERE status = ?' : ''}`).get(...(status ? [status] : [])) as any).count;
  const payments = db.prepare(query).all(...params, limit, offset);
  res.json({ success: true, data: { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// POST /api/admin/payments/:id/validate
router.post('/payments/:id/validate', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();

  // Transaction atomique pour garantir l'intégrité financière (pas de double-crédit)
  const validatePayment = db.transaction(() => {
    // Verrouillage par mise à jour statut en premier (idempotence)
    const updated = db.prepare(
      'UPDATE payment_requests SET status = "approved", processed_by = ?, processed_at = datetime("now"), updated_at = datetime("now") WHERE id = ? AND status = "pending"'
    ).run(req.user!.id, req.params.id);

    if (updated.changes === 0) {
      return null; // Déjà traitée ou inexistante
    }

    const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(req.params.id) as any;
    const user = db.prepare('SELECT id, credits FROM users WHERE id = ?').get(payment.user_id) as any;
    const newBalance = user.credits + payment.credits;

    db.prepare('UPDATE users SET credits = ?, updated_at = datetime("now") WHERE id = ?').run(newBalance, user.id);
    db.prepare(`INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, description, ref, admin_id) VALUES (?, ?, 'credit', ?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), user.id, payment.credits, user.credits, newBalance, `Paiement validé — Ref: ${payment.ref}`, payment.ref, req.user!.id);
    db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), user.id, 'Paiement validé !', `+${payment.credits} crédits ont été ajoutés à votre compte. Référence : ${payment.ref}`, 'success');

    return { payment, newBalance };
  });

  const result = validatePayment();
  if (!result) {
    res.status(400).json({ success: false, message: 'Demande introuvable ou déjà traitée' });
    return;
  }

  logAction({ userId: req.user!.id, action: 'ADMIN_VALIDATE_PAYMENT', entity: 'payment', entityId: result.payment.id, details: `+${result.payment.credits} crédits → User ${result.payment.user_id}`, ip: req.ip });
  res.json({ success: true, message: `Paiement validé. +${result.payment.credits} crédits ajoutés.`, data: { newBalance: result.newBalance } });
});

// POST /api/admin/payments/:id/reject
router.post('/payments/:id/reject', param('id').isUUID(), body('reason').optional().isString(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payment_requests WHERE id = ?').get(req.params.id) as any;
  if (!payment) { res.status(404).json({ success: false, message: 'Demande introuvable' }); return; }
  if (payment.status !== 'pending') { res.status(400).json({ success: false, message: 'Demande déjà traitée' }); return; }

  db.prepare('UPDATE payment_requests SET status = "rejected", processed_by = ?, processed_at = datetime("now"), notes = ?, updated_at = datetime("now") WHERE id = ?')
    .run(req.user!.id, req.body.reason || null, payment.id);
  db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), payment.user_id, 'Paiement refusé', `Votre demande ${payment.ref} a été refusée. ${req.body.reason || ''}`, 'error');

  logAction({ userId: req.user!.id, action: 'ADMIN_REJECT_PAYMENT', entity: 'payment', entityId: payment.id, ip: req.ip });
  res.json({ success: true, message: 'Demande refusée' });
});

// GET /api/admin/packs
router.get('/packs', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const packs = db.prepare('SELECT * FROM credit_packs ORDER BY sort_order ASC').all();
  res.json({ success: true, data: { packs } });
});

// POST /api/admin/packs
router.post('/packs',
  [body('name').trim().isLength({ min: 2, max: 50 }), body('credits').isInt({ min: 1 }), body('price').isInt({ min: 1 }), body('durationDays').isInt({ min: 1 }), body('description').optional().isString(), body('sortOrder').optional().isInt()],
  validate,
  (req: AuthRequest, res: Response) => {
    const { name, credits, price, durationDays, description, sortOrder } = req.body;
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO credit_packs (id, name, credits, price, duration_days, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, name, credits, price, durationDays, description || null, sortOrder || 0);
    logAction({ userId: req.user!.id, action: 'ADMIN_CREATE_PACK', entity: 'pack', entityId: id, ip: req.ip });
    const pack = db.prepare('SELECT * FROM credit_packs WHERE id = ?').get(id);
    res.status(201).json({ success: true, message: 'Pack créé', data: { pack } });
  }
);

// PUT /api/admin/packs/:id
router.put('/packs/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const pack = db.prepare('SELECT * FROM credit_packs WHERE id = ?').get(req.params.id) as any;
  if (!pack) { res.status(404).json({ success: false, message: 'Pack introuvable' }); return; }
  const { name, credits, price, durationDays, description, isActive, sortOrder } = req.body;
  db.prepare('UPDATE credit_packs SET name = COALESCE(?,name), credits = COALESCE(?,credits), price = COALESCE(?,price), duration_days = COALESCE(?,duration_days), description = COALESCE(?,description), is_active = COALESCE(?,is_active), sort_order = COALESCE(?,sort_order), updated_at = datetime("now") WHERE id = ?')
    .run(name||null, credits||null, price||null, durationDays||null, description||null, isActive!=null?isActive:null, sortOrder||null, pack.id);
  logAction({ userId: req.user!.id, action: 'ADMIN_UPDATE_PACK', entity: 'pack', entityId: pack.id, ip: req.ip });
  res.json({ success: true, message: 'Pack mis à jour' });
});

// DELETE /api/admin/packs/:id
router.delete('/packs/:id', param('id').isUUID(), validate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM credit_packs WHERE id = ?').run(req.params.id);
  logAction({ userId: req.user!.id, action: 'ADMIN_DELETE_PACK', entity: 'pack', entityId: req.params.id, ip: req.ip });
  res.json({ success: true, message: 'Pack supprimé' });
});

// GET /api/admin/logs
router.get('/logs', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = (page - 1) * limit;
  const total = (db.prepare('SELECT COUNT(*) as count FROM system_logs').get() as any).count;
  const logs = db.prepare(`
    SELECT sl.*, u.username FROM system_logs sl LEFT JOIN users u ON sl.user_id = u.id
    ORDER BY sl.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  res.json({ success: true, data: { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// POST /api/admin/notifications — Notification globale
router.post('/notifications',
  [body('title').trim().isLength({ min: 3 }), body('message').trim().isLength({ min: 5 }), body('type').isIn(['info', 'success', 'warning', 'error'])],
  validate,
  (req: AuthRequest, res: Response) => {
    const { title, message, type } = req.body;
    const db = getDb();
    db.prepare('INSERT INTO notifications (id, title, message, type, is_global) VALUES (?, ?, ?, ?, 1)').run(uuidv4(), title, message, type);
    logAction({ userId: req.user!.id, action: 'ADMIN_SEND_NOTIFICATION', details: title, ip: req.ip });
    res.status(201).json({ success: true, message: 'Notification envoyée à tous les utilisateurs' });
  }
);

// POST /api/admin/announcements
router.post('/announcements',
  [body('title').trim().isLength({ min: 3 }), body('content').trim().isLength({ min: 5 }), body('type').optional().isIn(['info', 'success', 'warning', 'error'])],
  validate,
  (req: AuthRequest, res: Response) => {
    const { title, content, type } = req.body;
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO announcements (id, title, content, type, is_active, created_by) VALUES (?, ?, ?, ?, 1, ?)').run(id, title, content, type || 'info', req.user!.id);
    logAction({ userId: req.user!.id, action: 'ADMIN_CREATE_ANNOUNCEMENT', entityId: id, ip: req.ip });
    res.status(201).json({ success: true, message: 'Annonce créée' });
  }
);

export default router;
