import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDb } from '../database/init';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    credits: number;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Middleware d'authentification JWT
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;

    if (!token) {
      res.status(401).json({ success: false, message: 'Token d\'authentification manquant' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, username, role, credits, is_active FROM users WHERE id = ?'
    ).get(decoded.id) as { id: string; email: string; username: string; role: string; credits: number; is_active: number } | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Compte désactivé. Contactez l\'administrateur.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      credits: user.credits,
    };
    next();
  } catch (err) {
    logger.warn('Token JWT invalide ou expiré');
    res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

/**
 * Middleware de vérification admin
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    return;
  }
  next();
};

/**
 * Middleware optionnel — n'échoue pas si pas de token
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.token;

    if (!token) return next();

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, username, role, credits FROM users WHERE id = ? AND is_active = 1'
    ).get(decoded.id) as { id: string; email: string; username: string; role: string; credits: number } | undefined;

    if (user) req.user = user;
  } catch {
    // Ignore silencieusement
  }
  next();
};
