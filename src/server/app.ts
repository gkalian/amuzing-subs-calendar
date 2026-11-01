import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { registerRequestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

// No CORS headers on purpose: the client is always served from the same origin
// (Express in production, Vite proxy in dev), so browsers block cross-site API calls.
export function createApp() {
  const app = express();

  app.use(express.json());
  registerRequestLogger(app);

  const clientDistPath = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDistPath));

  app.use('/api/subscriptions', subscriptionsRouter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Unknown API routes get JSON, not the SPA or an HTML page
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // SPA fallback
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const indexPath = path.join(clientDistPath, 'index.html');
    if (!existsSync(indexPath)) return next();
    res.sendFile(indexPath);
  });

  // Errors always come back as JSON (malformed body, oversized body, unexpected failures)
  const errorHandler: express.ErrorRequestHandler = (err, req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body', field: 'body' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large', field: 'body' });
    }
    logger.error('unhandled', {
      method: req.method,
      url: req.originalUrl,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
