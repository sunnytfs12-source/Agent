import express, { Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv  from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

import authRouter          from './routes/auth';
import tasksRouter         from './routes/tasks';
import categoriesRouter    from './routes/categories';
import notificationsRouter from './routes/notifications';
import syncRouter          from './routes/sync';
import adminRouter         from './routes/admin';
import { errorHandler, createError } from './middleware/errorHandler';

const app    = express();
const isDev  = process.env.NODE_ENV !== 'production';

// ─────────────────────────────────────────────
// 1. Request ID — tag every request so logs are
//    correlatable with error responses
// ─────────────────────────────────────────────
app.use((req: any, _res: Response, next: NextFunction) => {
  req.id = uuidv4().slice(0, 8); // short 8-char ID, e.g. "a3f9c12b"
  next();
});

// ─────────────────────────────────────────────
// 2. Security headers
// ─────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────
// 3. CORS
// ─────────────────────────────────────────────
app.use(cors({
  origin:         process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────────
// 4. Body parsers with size limit
//    1 MB is plenty for this app; guards against
//    oversized payloads crashing the process.
// ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Catch malformed JSON and return a clear 400
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body.', status: 400 });
    return;
  }
  next(err);
});

// ─────────────────────────────────────────────
// 5. Request logger
//    In dev: coloured short format
//    In prod: Apache combined (good for log shippers)
// ─────────────────────────────────────────────
morgan.token('id', (req: any) => req.id ?? '-');
app.use(
  morgan(
    isDev
      ? ':id :method :url :status :response-time ms'
      : ':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'
  )
);

// ─────────────────────────────────────────────
// 6. Rate limiting
// ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests — please slow down.', status: 429 },
  keyGenerator:    (req) => (req as any).id ?? req.ip ?? 'unknown',
});

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many auth attempts. Try again in 15 minutes.', status: 429 },
});

app.use(globalLimiter);

// ─────────────────────────────────────────────
// 7. Health check (unauthenticated)
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ─────────────────────────────────────────────
// 8. Routes
// ─────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRouter);
app.use('/api/tasks',         tasksRouter);
app.use('/api',               categoriesRouter);   // /api/categories + /api/tags
app.use('/api/notifications', notificationsRouter);
app.use('/api/sync',          syncRouter);
app.use('/api/admin',         adminRouter);

// ─────────────────────────────────────────────
// 9. 404 — route not found
// ─────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(createError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// ─────────────────────────────────────────────
// 10. Global error handler (must be last)
// ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
