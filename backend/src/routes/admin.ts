import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../utils/activityLog';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate, requireAdmin);

function now(): string { return new Date().toISOString(); }

// ─────────────────────────────────────────────
// GET /admin/dashboard
// ─────────────────────────────────────────────
router.get('/dashboard', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users)                                            AS totalUsers,
        (SELECT COUNT(*) FROM tasks  WHERE is_deleted = 0)                     AS totalTasks,
        (SELECT COUNT(*) FROM tasks  WHERE status = 'completed' AND is_deleted = 0) AS completedTasks,
        (SELECT COUNT(*) FROM tasks  WHERE status = 'pending'   AND is_deleted = 0) AS pendingTasks,
        (SELECT COUNT(DISTINCT user_id) FROM refresh_tokens
          WHERE created_at >= datetime('now','-1 day'))                        AS activeUsersToday
    `).get() as any;

    const totalTasks     = Number(stats.totalTasks);
    const completedTasks = Number(stats.completedTasks);

    const priorityBreakdown = db.prepare(`
      SELECT priority, COUNT(*) AS count
      FROM tasks WHERE is_deleted = 0
      GROUP BY priority
    `).all() as any[];

    const categoryBreakdown = db.prepare(`
      SELECT c.name, c.color, COUNT(tc.task_id) AS task_count
      FROM categories c
      LEFT JOIN task_categories tc ON tc.category_id = c.id
      GROUP BY c.id
      ORDER BY task_count DESC
      LIMIT 10
    `).all() as any[];

    const recentActivity = db.prepare(`
      SELECT al.*, u.name AS user_name, u.email AS user_email
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all() as any[];

    res.json({
      stats: {
        totalUsers:       Number(stats.totalUsers),
        totalTasks,
        completedTasks,
        pendingTasks:     Number(stats.pendingTasks),
        completionRate:   totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
        activeUsersToday: Number(stats.activeUsersToday),
      },
      recentActivity,
      priorityBreakdown: priorityBreakdown.map((r) => ({ priority: r.priority, count: Number(r.count) })),
      categoryBreakdown: categoryBreakdown.map((r) => ({ name: r.name, color: r.color, task_count: Number(r.task_count) })),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// GET /admin/users
// ─────────────────────────────────────────────
router.get('/users', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pg     = Math.max(1, parseInt(page));
    const lim    = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pg - 1) * lim;

    const conditions: string[] = [];
    const params: any[]        = [];

    if (search) { conditions.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (role)   { conditions.push('u.role = ?'); params.push(role); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM users u ${where}`).get(...params) as any).cnt;

    const rows = db.prepare(`
      SELECT u.*,
             COUNT(t.id) AS task_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_task_count
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id AND t.is_deleted = 0
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, lim, offset) as any[];

    const users = rows.map(({ password_hash, ...u }: any) => ({ ...u, is_active: Boolean(u.is_active) }));

    res.json({
      data: users,
      pagination: { total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) || 1 },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// GET /admin/users/:id
// ─────────────────────────────────────────────
router.get('/users/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!userRow) return next(createError('User not found.', 404));

    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 20'
    ).all(req.params.id);

    const { password_hash, ...user } = userRow;
    res.json({ data: { ...user, is_active: Boolean(user.is_active), tasks } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// POST /admin/users
// ─────────────────────────────────────────────
router.post(
  '/users',
  [
    body('name').trim().notEmpty().isLength({ max: 255 }),
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['user','admin','superadmin']),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body as {
        name: string; email: string; password: string; role?: string;
      };

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return next(createError('Email already in use.', 409));

      const hash = await bcrypt.hash(password, 12);
      const id   = uuidv4();
      const ts   = now();

      db.prepare(
        `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
      ).run(id, name, email, hash, role ?? 'user', ts, ts);

      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      const { password_hash, ...user } = row;

      logActivity({ userId: req.user!.userId, action: 'ADMIN_USER_CREATED', entityType: 'user',
        entityId: id, newData: { email, role: user.role }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

      res.status(201).json({ data: { ...user, is_active: Boolean(user.is_active) } });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// PUT /admin/users/:id
// ─────────────────────────────────────────────
router.put(
  '/users/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 255 }),
    body('role').optional().isIn(['user','admin','superadmin']),
    body('is_active').optional().isBoolean(),
    body('password').optional().isLength({ min: 6 }),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, role, is_active, password } = req.body as {
        name?: string; role?: string; is_active?: boolean; password?: string;
      };

      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
      if (!existing) return next(createError('User not found.', 404));

      let passwordHash: string | undefined;
      if (password) passwordHash = await bcrypt.hash(password, 12);

      const ts = now();
      db.prepare(`
        UPDATE users
        SET name          = COALESCE(?, name),
            role          = COALESCE(?, role),
            is_active     = COALESCE(?, is_active),
            password_hash = COALESCE(?, password_hash),
            updated_at    = ?
        WHERE id = ?
      `).run(
        name ?? null, role ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        passwordHash ?? null, ts, req.params.id
      );

      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
      const { password_hash, ...user } = row;

      logActivity({ userId: req.user!.userId, action: 'ADMIN_USER_UPDATED', entityType: 'user',
        entityId: req.params.id,
        oldData: { role: existing.role, is_active: existing.is_active },
        newData: { role: user.role, is_active: user.is_active },
        ipAddress: req.ip, userAgent: req.headers['user-agent'] });

      res.json({ data: { ...user, is_active: Boolean(user.is_active) } });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// DELETE /admin/users/:id
// ─────────────────────────────────────────────
router.delete('/users/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.userId) {
      return next(createError('You cannot delete your own account.', 400));
    }
    const row = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id) as any;
    if (!row) return next(createError('User not found.', 404));

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    logActivity({ userId: req.user!.userId, action: 'ADMIN_USER_DELETED', entityType: 'user',
      entityId: req.params.id, oldData: { email: row.email },
      ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.json({ data: { message: 'User deleted.' } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// GET /admin/activity-logs
// ─────────────────────────────────────────────
router.get('/activity-logs', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { user_id, entity_type, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pg     = Math.max(1, parseInt(page));
    const lim    = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pg - 1) * lim;

    const conditions: string[] = [];
    const params: any[] = [];

    if (user_id)     { conditions.push('al.user_id = ?');      params.push(user_id); }
    if (entity_type) { conditions.push('al.entity_type = ?');  params.push(entity_type); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM activity_logs al ${where}`).get(...params) as any).cnt;

    const rows = db.prepare(`
      SELECT al.*, u.name AS user_name, u.email AS user_email
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, lim, offset);

    res.json({
      data: rows,
      pagination: { total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) || 1 },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// GET /admin/export
// ─────────────────────────────────────────────
router.get('/export', (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, is_active, created_at FROM users'
    ).all();
    const tasks = db.prepare('SELECT * FROM tasks WHERE is_deleted = 0').all();
    res.json({ data: { users, tasks, exportedAt: now() } });
  } catch (err) { next(err); }
});

export default router;
