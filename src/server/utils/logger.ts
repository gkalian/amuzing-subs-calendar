import util from 'node:util';
import express from 'express';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export class Logger {
  private minLevel: LogLevel;
  private name?: string;

  constructor(opts?: { level?: LogLevel; name?: string }) {
    this.minLevel = opts?.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.name = opts?.name;
  }

  child(name: string) {
    return new Logger({ level: this.minLevel, name });
  }

  setLevel(level: LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel) {
    return LEVELS[level] <= LEVELS[this.minLevel];
  }

  private emit(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;
    const record: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...(this.name ? { logger: this.name } : {}),
      ...(data || {}),
    };
    // Single line JSON for easy ingestion
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(record));
  }

  error(message: string, data?: Record<string, unknown>) {
    this.emit('error', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.emit('warn', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.emit('info', message, data);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.emit('debug', message, data);
  }
}

export const logger = new Logger();

// Wrap a route handler to automatically log method, status, duration, requestId and optional endpoint metadata.
export function withEndpointLogging(
  name: string,
  handler: express.RequestHandler,
): express.RequestHandler {
  return async (req, res, next) => {
    const start = Date.now();
    const onFinish = () => {
      // Attach any endpoint-specific metadata if handler set it into res.locals.endpointMeta
      const requestId = (res.locals as any)?.requestId as string | undefined;
      const endpointMeta = ((res.locals as any)?.endpointMeta || {}) as Record<string, unknown>;
      logger.debug(name, {
        method: req.method,
        status: res.statusCode,
        durationMs: Date.now() - start,
        requestId,
        ...endpointMeta,
      });
      res.off('finish', onFinish);
    };
    res.on('finish', onFinish);
    try {
      await Promise.resolve(handler(req, res, next));
    } catch (err) {
      const requestId = (res.locals as any)?.requestId as string | undefined;
      logger.error(`${name}.error`, {
        method: req.method,
        requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  };
}
