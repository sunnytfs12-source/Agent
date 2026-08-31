import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
  isOperational?: boolean; // true = known/expected error, false = programmer bug
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global error handler — registered last in app.ts.
 * Returns a consistent JSON shape for every error.
 *
 * Response shape:
 * {
 *   error:     string           — human-readable message
 *   status:    number           — HTTP status code
 *   requestId: string | null    — correlates with server logs
 *   details?:  any              — validation errors etc.
 *   stack?:    string           — only in development
 * }
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status    = err.statusCode ?? 500;
  const requestId = (req as any).id ?? null;

  // Log all 5xx errors — operational 4xx errors don't need a stack trace
  if (status >= 500) {
    console.error(`[ERROR] ${requestId ? `[${requestId}] ` : ''}${req.method} ${req.originalUrl}`);
    console.error(`        Status : ${status}`);
    console.error(`        Message: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }

  const body: Record<string, any> = {
    error:     err.message || 'Internal server error',
    status,
    requestId,
  };

  if (err.details)            body.details = err.details;
  if (isDev && err.stack)     body.stack   = err.stack;

  res.status(status).json(body);
}

/** Factory for known HTTP errors — keeps routes clean */
export function createError(
  message: string,
  statusCode = 400,
  details?: any
): AppError {
  const err: AppError    = new Error(message);
  err.statusCode         = statusCode;
  err.details            = details;
  err.isOperational      = true;
  return err;
}
