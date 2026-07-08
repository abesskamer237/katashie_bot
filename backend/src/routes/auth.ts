import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/init';
import { config } from '../config';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { logAction } from '../middleware/logger';
import { generateToken } from '../utils/helpers';
import { logger } from '../utils/logger';

const router = Router();

const generateTokens = (user: { id: string; email: string; username: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn as any,
    }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn as any,
    }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Nom d\'utilisateur : 3-30 caractères')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nom d\'utilisateur : lettres, chiffres et _ uniquement'),
    body('email').isEmail().normalizeEmail().withMessage('Adresse e-mail invalide'),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe : minimum 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Mot de passe : au moins une majuscule, une minuscule et un chiffre'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password } = req.body;
      const db = getDb();

      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        res.status(409).json({ success: false, message: 'Cette adresse e-mail est déjà utilisée' });
        return;
      }

      const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUsername) {
        res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      db.prepare(`
        INSERT INTO users (id, username, email, password, role, credits, is_active, is_verified)
        VALUES (?, ?, ?, ?, 'user', 0, 1, 1)
      `).run(userId, username, email, hashedPassword);

      const { accessToken, refreshToken } = generateTokens({ id: userId, email, username, role: 'user' });

      logAction({ userId, action: 'REGISTER', entity: 'user', entityId: userId, ip: req.ip });
      logger.info(`Nouvel utilisateur enregistré : ${email}`);

      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: { id: userId, username, email, role: 'user', credits: 0 },
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      logger.error('Erreur register:', err);
      res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('E-mail invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      const db = getDb();

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        res.status(401).json({ success: false, message: 'Identifiants incorrects' });
        return;
      }

      if (!user.is_active) {
        res.status(403).json({ success: false, message: 'Compte désactivé. Contactez l\'administrateur.' });
        return;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        logAction({ userId: user.id, action: 'LOGIN_FAILED', entity: 'user', entityId: user.id, ip: req.ip });
        res.status(401).json({ success: false, message: 'Identifiants incorrects' });
        return;
      }

      // Mise à jour dernière connexion
      db.prepare('UPDATE users SET last_login = datetime("now"), last_ip = ?, updated_at = datetime("now") WHERE id = ?')
        .run(req.ip, user.id);

      const { accessToken, refreshToken } = generateTokens({
        id: user.id, email: user.email, username: user.username, role: user.role,
      });

      logAction({ userId: user.id, action: 'LOGIN', entity: 'user', entityId: user.id, ip: req.ip });

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: { id: user.id, username: user.username, email: user.email, role: user.role, credits: user.credits },
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      logger.error('Erreur login:', err);
      res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token manquant' });
      return;
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { id: string };
    const db = getDb();
    const user = db.prepare('SELECT id, email, username, role, credits, is_active FROM users WHERE id = ?').get(decoded.id) as any;

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, message: 'Token invalide' });
      return;
    }

    const tokens = generateTokens({ id: user.id, email: user.email, username: user.username, role: user.role });
    res.json({ success: true, data: tokens });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, email, role, credits, last_login, last_ip, created_at FROM users WHERE id = ?'
  ).get(req.user!.id) as any;
  res.json({ success: true, data: { user } });
});

// POST /api/auth/forgot-password
router.post('/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { email } = req.body;
      const db = getDb();
      const user = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email) as any;

      // Toujours répondre 200 pour éviter l'énumération d'e-mails
      if (!user) {
        res.json({ success: true, message: 'Si cet e-mail existe, un lien de réinitialisation a été envoyé.' });
        return;
      }

      const resetToken = generateToken(32);
      const expires = new Date(Date.now() + 3600000).toISOString(); // 1h

      db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
        .run(resetToken, expires, user.id);

      logAction({ userId: user.id, action: 'PASSWORD_RESET_REQUEST', entity: 'user', entityId: user.id, ip: req.ip });
      // SÉCURITÉ : Ne jamais logger le token de réinitialisation — il vaut un mot de passe
      logger.info(`Réinitialisation demandée pour l'utilisateur ID: ${user.id} depuis ${req.ip}`);

      // En développement : retourner le token dans la réponse (pas de serveur SMTP)
      // En production : envoyer le token uniquement par e-mail (SMTP configuré)
      const debugPayload = config.env === 'development'
        ? { debug_token: resetToken, debug_note: 'Token visible uniquement en développement' }
        : {};

      res.json({ success: true, message: 'Si cet e-mail existe, un lien de réinitialisation a été envoyé.', ...debugPayload });
    } catch (err) {
      logger.error('Erreur forgot-password:', err);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
);

// POST /api/auth/reset-password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { token, password } = req.body;
      const db = getDb();
      const user = db.prepare(
        'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime("now")'
      ).get(token) as any;

      if (!user) {
        res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
        return;
      }

      const hashed = await bcrypt.hash(password, 12);
      db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime("now") WHERE id = ?')
        .run(hashed, user.id);

      logAction({ userId: user.id, action: 'PASSWORD_RESET', entity: 'user', entityId: user.id, ip: req.ip });
      res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
    } catch (err) {
      logger.error('Erreur reset-password:', err);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
);

// PUT /api/auth/change-password
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const db = getDb();
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user!.id) as any;

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
        return;
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?')
        .run(hashed, req.user!.id);

      logAction({ userId: req.user!.id, action: 'PASSWORD_CHANGE', entity: 'user', entityId: req.user!.id, ip: req.ip });
      res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (err) {
      logger.error('Erreur change-password:', err);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
);

// PUT /api/auth/profile
router.put('/profile',
  authenticate,
  [body('username').optional().trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { username } = req.body;
      const db = getDb();

      if (username) {
        const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user!.id);
        if (existing) {
          res.status(409).json({ success: false, message: 'Nom d\'utilisateur déjà pris' });
          return;
        }
        db.prepare('UPDATE users SET username = ?, updated_at = datetime("now") WHERE id = ?').run(username, req.user!.id);
      }

      const updated = db.prepare('SELECT id, username, email, role, credits, created_at FROM users WHERE id = ?').get(req.user!.id);
      res.json({ success: true, message: 'Profil mis à jour', data: { user: updated } });
    } catch (err) {
      logger.error('Erreur update profile:', err);
      res.status(500).json({ success: false, message: 'Erreur interne' });
    }
  }
);

export default router;