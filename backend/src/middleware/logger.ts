import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/init';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

/**
 * Enregistre une action dans les logs système
 */
export const logAction = (params: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ip?: string;
}): void => {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO system_logs (id, user_id, action, entity, entity_id, details, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      params.userId || null,
      params.action,
      params.entity || null,
      params.entityId || null,
      params.details || null,
      params.ip || null
    );
  } catch (err) {
    logger.error('Erreur lors de l\'enregistrement du log:', err);
  }
};

/**
 * Middleware de logging HTTP
 */
export const httpLogger = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms — IP: ${req.ip}`;
    if (res.statusCode >= 500) {
      logger.error(msg);
    } else if (res.statusCode >= 400) {
      logger.warn(msg);
    } else {
      logger.info(msg);
    }
  });
  next();
};
