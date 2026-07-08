import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware de validation — vérifie les erreurs de express-validator
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map((e) => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg })),
    });
    return;
  }
  next();
};
