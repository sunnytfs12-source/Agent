import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

interface SyncOperation {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK';
  data: Record<string, any>;
}

function now(): string { return new Date().toISOString(); }

/**
 * POST /sync/bulk
 * Replays offline-queued operations inside a single SQLite transaction.
 */
router.post(
  '/bulk',
  [body('operations').isArray({ min: 1 }).withMessage('operations must be a non-empty array')],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const uid = req.user!.userId;
    const { operations } = req.body as { operations: SyncOperation[] };
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    try {
      db.exec('BEGIN');
      try {
        for (const op of operations) {
          try {
            switch (op.type) {
              case 'CREATE_TASK': {
                const { title, description, priority, due_date, effort_estimate, status } = op.data;
                const orderRow = db.prepare(
                  'SELECT COALESCE(MAX(order_index), -1) + 1 AS next_idx FROM tasks WHERE user_id = ?'
                ).get(uid) as any;
                const ts = now();
                db.prepare(`
                  INSERT OR IGNORE INTO tasks
                    (id, user_id, title, description, priority, due_date, effort_estimate, status, order_index, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  op.id, uid, title, description ?? null,
                  priority ?? 'medium', due_date ?? null,
                  effort_estimate ?? 1, status ?? 'pending',
                  Number(orderRow.next_idx), ts, ts
                );
                results.push({ id: op.id, success: true });
                break;
              }
              case 'UPDATE_TASK': {
                const { title, description, status, priority, due_date, effort_estimate } = op.data;
                db.prepare(`
                  UPDATE tasks SET
                    title           = COALESCE(?, title),
                    description     = COALESCE(?, description),
                    status          = COALESCE(?, status),
                    priority        = COALESCE(?, priority),
                    due_date        = COALESCE(?, due_date),
                    effort_estimate = COALESCE(?, effort_estimate),
                    updated_at      = ?
                  WHERE id = ? AND user_id = ?
                `).run(
                  title ?? null, description ?? null, status ?? null,
                  priority ?? null, due_date ?? null, effort_estimate ?? null,
                  now(), op.id, uid
                );
                results.push({ id: op.id, success: true });
                break;
              }
              case 'DELETE_TASK': {
                db.prepare(
                  'UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?'
                ).run(now(), op.id, uid);
                results.push({ id: op.id, success: true });
                break;
              }
              default:
                results.push({ id: op.id, success: false, error: 'Unknown operation type' });
            }
          } catch (opErr: any) {
            results.push({ id: op.id, success: false, error: opErr.message });
          }
        }
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }

      const processed = results.filter((r) => r.success).length;
      res.json({ data: results, processed });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
