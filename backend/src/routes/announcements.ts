import { Router, Response } from 'express';
import { getDb } from '../database/init';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/announcements — Annonces publiques actives
router.get('/', optionalAuth, (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const announcements = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10').all();
  res.json({ success: true, data: { announcements } });
});

export default router;
