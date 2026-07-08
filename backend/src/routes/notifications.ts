import { Router, Response } from 'express';
import { getDb } from '../database/init';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/notifications — non lues uniquement
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE (user_id = ? OR is_global = 1) AND is_read = 0
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user!.id);
  res.json({ success: true, data: { notifications } });
});

// GET /api/notifications/all — toutes (lues + non lues)
router.get('/all', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR is_global = 1
    ORDER BY created_at DESC LIMIT 100
  `).all(req.user!.id);
  res.json({ success: true, data: { notifications } });
});

// BUG FIX : /read-all DOIT être déclaré AVANT /:id/read
// Sinon Express interprète "read-all" comme une valeur de paramètre :id
// POST /api/notifications/read-all — marquer toutes comme lues
router.post('/read-all', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR is_global = 1').run(req.user!.id);
  res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
});

// POST /api/notifications/:id/read — marquer UNE notification comme lue
router.post('/:id/read', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR is_global = 1)'
  ).run(req.params.id, req.user!.id);
  res.json({ success: true, message: 'Notification marquée comme lue' });
});

export default router;
