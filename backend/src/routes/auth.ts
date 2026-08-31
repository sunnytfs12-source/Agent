import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logActivity } from '../utils/activityLog';
import { AuthRequest } from '../types';

const router = Router();

function now(): string { return new Date().toISOString(); }

// ─────────────────────────────────────────────
// Seed default categories + tags + notification
// for a brand-new user
// ─────────────────────────────────────────────
function seedDefaultsForUser(userId: string): void {
  const cats = [
    { name: 'Work',     color: '#6366f1', icon: 'briefcase' },
    { name: 'Personal', color: '#10b981', icon: 'person'    },
    { name: 'Study',    color: '#f59e0b', icon: 'book'      },
  ];
  const insertCat = db.prepare(
    `INSERT INTO categories (id, user_id, name, color, icon, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  );
  for (const c of cats) insertCat.run(uuidv4(), userId, c.name, c.color, c.icon, now());

  const tags = [
    { name: 'urgent', color: '#ef4444' },
    { name: 'review', color: '#8b5cf6' },
  ];
  const insertTag = db.prepare(
    `INSERT INTO tags (id, user_id, name, color, is_default, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`
  );
  for (const t of tags) insertTag.run(uuidv4(), userId, t.name, t.color, now());

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, created_at)
     VALUES (?, ?, 'welcome', ?, ?, ?)`
  ).run(uuidv4(), userId, 'Welcome to MSCIT Todo! 🎉', 'Start by creating your first task.', now());
}

// ─────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as { name: string; email: string; password: string };

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return next(createError('An account with this email already exists.', 409));

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = uuidv4();
      const ts = now();

      db.prepare(
        `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'user', 1, ?, ?)`
      ).run(userId, name, email, passwordHash, ts, ts);

      seedDefaultsForUser(userId);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
      const { password_hash, ...safeUser } = user;
      safeUser.is_active = Boolean(safeUser.is_active);

      const accessToken  = signAccessToken(userId, 'user');
      const refreshToken = signRefreshToken(userId, 'user');

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(
        `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(uuidv4(), userId, refreshToken, expiresAt, ts);

      db.prepare('UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?')
        .run(ts, ts, userId);

      logActivity({ userId, action: 'USER_REGISTERED', entityType: 'user', entityId: userId,
        ipAddress: req.ip, userAgent: req.headers['user-agent'] });

      res.status(201).json({ data: { user: safeUser, accessToken, refreshToken } });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!row) return next(createError('No account found with that email.', 401));
      if (!row.is_active) return next(createError('Your account has been deactivated.', 403));

      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid) return next(createError('Incorrect password.', 401));

      const { password_hash, ...safeUser } = row;
      safeUser.is_active = Boolean(safeUser.is_active);

      const accessToken  = signAccessToken(safeUser.id, safeUser.role);
      const refreshToken = signRefreshToken(safeUser.id, safeUser.role);
      const ts = now();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(
        `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(uuidv4(), safeUser.id, refreshToken, expiresAt, ts);

      db.prepare('UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?')
        .run(ts, ts, safeUser.id);

      logActivity({ userId: safeUser.id, action: 'USER_LOGIN', entityType: 'user', entityId: safeUser.id,
        ipAddress: req.ip, userAgent: req.headers['user-agent'] });

      // Login notification
      db.prepare(
        `INSERT INTO notifications (id, user_id, type, title, message, created_at)
         VALUES (?, ?, 'LOGIN', ?, ?, ?)`
      ).run(uuidv4(), safeUser.id,
        `Signed in`,
        `Welcome back, ${safeUser.name}! You signed in successfully.`,
        ts);

      res.json({ data: { user: safeUser, accessToken, refreshToken } });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    }
    res.json({ data: { message: 'Logged out successfully.' } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────
router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return next(createError('Refresh token required.', 401));

    let payload: ReturnType<typeof verifyRefreshToken>;
    try { payload = verifyRefreshToken(refreshToken); }
    catch { return next(createError('Refresh token invalid or expired.', 401)); }

    if (payload.type !== 'refresh') return next(createError('Invalid token type.', 401));

    const stored = db.prepare(
      `SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ?`
    ).get(refreshToken, now()) as any;
    if (!stored) return next(createError('Refresh token revoked or expired.', 401));

    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;
    if (!userRow) return next(createError('User not found.', 401));

    const newAccess  = signAccessToken(userRow.id, userRow.role);
    const newRefresh = signRefreshToken(userRow.id, userRow.role);
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const ts = now();

    db.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuidv4(), userRow.id, newRefresh, expiresAt, ts);

    res.json({ data: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────
router.get('/me', authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const row = db.prepare(`
      SELECT u.*,
             COUNT(t.id)                                            AS task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_task_count
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id AND t.is_deleted = 0
      WHERE u.id = ?
      GROUP BY u.id
    `).get(req.user!.userId) as any;

    if (!row) return next(createError('User not found.', 404));
    const { password_hash, ...safeUser } = row;
    safeUser.is_active = Boolean(safeUser.is_active);
    res.json({ data: safeUser });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// PUT /auth/profile
// ─────────────────────────────────────────────
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 255 }),
    body('theme').optional().isIn(['dark', 'light']),
    body('avatar_url').optional({ nullable: true }),
    body('preferences').optional().isObject(),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, theme, avatar_url, preferences } = req.body as {
        name?: string; theme?: string; avatar_url?: string | null; preferences?: Record<string, any>;
      };
      const ts = now();

      db.prepare(`
        UPDATE users
        SET name        = COALESCE(?, name),
            theme       = COALESCE(?, theme),
            avatar_url  = COALESCE(?, avatar_url),
            preferences = COALESCE(?, preferences),
            updated_at  = ?
        WHERE id = ?
      `).run(
        name        ?? null,
        theme       ?? null,
        avatar_url  !== undefined ? avatar_url : null,
        preferences ? JSON.stringify(preferences) : null,
        ts,
        req.user!.userId
      );

      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
      if (!row) return next(createError('User not found.', 404));
      const { password_hash, ...safeUser } = row;
      safeUser.is_active = Boolean(safeUser.is_active);
      res.json({ data: safeUser });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// PUT /auth/change-password
// ─────────────────────────────────────────────
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
      if (!row) return next(createError('User not found.', 404));

      const valid = await bcrypt.compare(currentPassword, row.password_hash);
      if (!valid) return next(createError('Current password is incorrect.', 401));

      const newHash = await bcrypt.hash(newPassword, 12);
      const ts = now();
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
        .run(newHash, ts, req.user!.userId);
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user!.userId);

      logActivity({ userId: req.user!.userId, action: 'PASSWORD_CHANGED', entityType: 'user',
        entityId: req.user!.userId, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

      res.json({ data: { message: 'Password updated successfully.' } });
    } catch (err) { next(err); }
  }
);

export default router;
