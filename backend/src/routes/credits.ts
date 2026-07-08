import { Router, Response } from 'express';
import { param, body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/init';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { actionLimiter } from '../middleware/rateLimit';
import { logAction } from '../middleware/logger';
import { buildWhatsAppPaymentLink, generatePaymentRef } from '../utils/helpers';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/credits/packs — Tous les packs disponibles
router.get('/packs', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const packs = db.prepare('SELECT * FROM credit_packs WHERE is_active = 1 ORDER BY sort_order ASC').all();
  res.json({ success: true, data: { packs } });
});

// GET /api/credits/history — Historique des transactions
router.get('/history', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM credit_transactions WHERE user_id = ?').get(req.user!.id) as any).count;
  const transactions = db.prepare('SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.user!.id, limit, offset);

  res.json({ success: true, data: { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// GET /api/credits/balance
router.get('/balance', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.id) as any;
  res.json({ success: true, data: { credits: user.credits } });
});

// POST /api/credits/request/:packId — Générer une demande de paiement
router.post('/request/:packId',
  actionLimiter,
  param('packId').isUUID(),
  validate,
  (req: AuthRequest, res: Response) => {
    try {
      const db = getDb();
      const pack = db.prepare('SELECT * FROM credit_packs WHERE id = ? AND is_active = 1').get(req.params.packId) as any;
      if (!pack) {
        res.status(404).json({ success: false, message: 'Pack introuvable ou inactif' });
        return;
      }

      const ref = generatePaymentRef();
      const whatsappLink = buildWhatsAppPaymentLink({
        adminWhatsapp: config.admin.whatsapp,
        username: req.user!.username,
        email: req.user!.email,
        packName: pack.name,
        credits: pack.credits,
        amount: pack.price,
        ref,
      });

      const requestId = uuidv4();
      db.prepare(`
        INSERT INTO payment_requests (id, user_id, pack_id, ref, amount, credits, status, whatsapp_link)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      `).run(requestId, req.user!.id, pack.id, ref, pack.price, pack.credits, whatsappLink);

      logAction({ userId: req.user!.id, action: 'PAYMENT_REQUEST', entity: 'payment', entityId: requestId, details: `Pack: ${pack.name} — ${pack.price} FCFA`, ip: req.ip });

      res.status(201).json({
        success: true,
        message: 'Demande de paiement créée',
        data: { requestId, ref, whatsappLink, pack: { name: pack.name, credits: pack.credits, price: pack.price } },
      });
    } catch (err) {
      logger.error('Erreur payment request:', err);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
);

// GET /api/credits/requests — Historique des demandes de paiement
router.get('/requests', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const requests = db.prepare(`
    SELECT pr.*, cp.name as pack_name FROM payment_requests pr
    LEFT JOIN credit_packs cp ON pr.pack_id = cp.id
    WHERE pr.user_id = ? ORDER BY pr.created_at DESC LIMIT 50
  `).all(req.user!.id);
  res.json({ success: true, data: { requests } });
});

export default router;
