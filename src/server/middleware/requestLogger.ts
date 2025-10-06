import express from 'express';
import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

export function registerRequestLogger(app: express.Application) {
  // Generate/propagate X-Request-Id
  app.use((req, res, next) => {
    const fromHeader = (req.headers['x-request-id'] as string) || '';
    const requestId = fromHeader || crypto.randomBytes(8).toString('hex');
    (res.locals as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // Access logger for every request
  app.use((req, res, next) => {
    const start = Date.now();
    const { method } = req;
    const url = (req as any).originalUrl || req.url;

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const requestId = (res.locals as any)?.requestId as string | undefined;
      logger.debug('access', { method, url, status, durationMs, requestId });
    });

    next();
  });
}
