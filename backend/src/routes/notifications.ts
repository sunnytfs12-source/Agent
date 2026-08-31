import { Router, Response, NextFunction } from 'express';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

// GET /notifications?limit=20
router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20')));
    const uid   = req.user!.userId;

    const rows = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(uid, limit) as any[];

    const unreadCount = rows.filter((n) => !n.is_read).length;
    res.json({
      data: rows.map((n) => ({ ...n, is_read: Boolean(n.is_read) })),
      unreadCount,
    });
  } catch (err) { next(err); }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.userId);
    if (result.changes === 0) return next(createError('Notification not found.', 404));
    res.json({ data: { message: 'Marked as read.' } });
  } catch (err) { next(err); }
});

// PATCH /notifications/read-all
router.patch('/read-all', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.userId);
    res.json({ data: { message: 'All notifications marked as read.' } });
  } catch (err) { next(err); }
});

export default router;
