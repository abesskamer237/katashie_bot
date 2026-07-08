import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config';
import fs from 'fs';

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(config.logs.dir)) {
  fs.mkdirSync(config.logs.dir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: config.logs.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console colorée
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),
    // Fichier quotidien — tous les logs
    new DailyRotateFile({
      filename: path.join(config.logs.dir, 'katashie-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
    // Fichier erreurs seulement
    new DailyRotateFile({
      level: 'error',
      filename: path.join(config.logs.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});
