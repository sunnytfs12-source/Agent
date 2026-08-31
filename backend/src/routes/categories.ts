import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

function now(): string { return new Date().toISOString(); }

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

router.get('/categories', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = db.prepare(`
      SELECT c.*,
             COUNT(tc.task_id) AS task_count
      FROM categories c
      LEFT JOIN task_categories tc ON tc.category_id = c.id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.is_default DESC, c.name
    `).all(req.user!.userId) as any[];
    res.json({ data: rows.map((r) => ({ ...r, is_default: Boolean(r.is_default) })) });
  } catch (err) { next(err); }
});

router.post(
  '/categories',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color must be a valid hex'),
    body('icon').optional().isLength({ max: 100 }),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, color, icon } = req.body as { name: string; color?: string; icon?: string };
      const id = uuidv4();
      db.prepare(
        `INSERT INTO categories (id, user_id, name, color, icon, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, req.user!.userId, name, color ?? '#6366f1', icon ?? 'folder', now());
      const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
      res.status(201).json({ data: { ...row, is_default: Boolean(row.is_default) } });
    } catch (err) { next(err); }
  }
);

router.put(
  '/categories/:id',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color must be a valid hex'),
    body('icon').optional().isLength({ max: 100 }),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, color, icon } = req.body as { name?: string; color?: string; icon?: string };
      const result = db.prepare(`
        UPDATE categories
        SET name  = COALESCE(?, name),
            color = COALESCE(?, color),
            icon  = COALESCE(?, icon)
        WHERE id = ? AND user_id = ?
      `).run(name ?? null, color ?? null, icon ?? null, req.params.id, req.user!.userId);

      if (result.changes === 0) return next(createError('Category not found.', 404));
      const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as any;
      res.json({ data: { ...row, is_default: Boolean(row.is_default) } });
    } catch (err) { next(err); }
  }
);

router.delete('/categories/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = db.prepare(
      'DELETE FROM categories WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.userId);
    if (result.changes === 0) return next(createError('Category not found.', 404));
    res.json({ data: { message: 'Category deleted.' } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────

router.get('/tags', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM tags WHERE user_id = ? ORDER BY is_default DESC, name'
    ).all(req.user!.userId) as any[];
    res.json({ data: rows.map((r) => ({ ...r, is_default: Boolean(r.is_default) })) });
  } catch (err) { next(err); }
});

router.post(
  '/tags',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color must be a valid hex'),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, color } = req.body as { name: string; color?: string };
      const id = uuidv4();
      db.prepare(
        'INSERT INTO tags (id, user_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(id, req.user!.userId, name, color ?? '#8b5cf6', now());
      const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as any;
      res.status(201).json({ data: { ...row, is_default: Boolean(row.is_default) } });
    } catch (err) { next(err); }
  }
);

router.delete('/tags/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = db.prepare(
      'DELETE FROM tags WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.userId);
    if (result.changes === 0) return next(createError('Tag not found.', 404));
    res.json({ data: { message: 'Tag deleted.' } });
  } catch (err) { next(err); }
});

export default router;
