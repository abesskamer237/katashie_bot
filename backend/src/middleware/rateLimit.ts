import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Limiteur global des requêtes API
 */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit dépassé — IP: ${req.ip}, URL: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Limiteur pour les routes d'authentification
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Auth rate limit dépassé — IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Limiteur pour les opérations coûteuses (création de serveur, etc.)
 */
export const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop d\'actions en peu de temps. Attendez un moment.',
  },
});
