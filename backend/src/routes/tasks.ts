import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import db from '../db/db';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';
import { logActivity } from '../utils/activityLog';
import { AuthRequest, Task, Subtask } from '../types';

const router = Router();
router.use(authenticate);

function now(): string { return new Date().toISOString(); }

/** Insert a notification row for the current user (fire-and-forget, never throws) */
function notify(userId: string, type: string, title: string, message?: string): void {
  try {
    db.prepare(
      `INSERT INTO notifications (id, user_id, type, title, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), userId, type, title, message ?? null, now());
  } catch (err) {
    console.warn('Notification insert failed (non-fatal):', err);
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildTask(row: any): Task {
  const categories = db.prepare(`
    SELECT c.* FROM categories c
    JOIN task_categories tc ON tc.category_id = c.id
    WHERE tc.task_id = ?
  `).all(row.id) as any[];

  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN task_tags tt ON tt.tag_id = t.id
    WHERE tt.task_id = ?
  `).all(row.id) as any[];

  const subCounts = db.prepare(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) AS done
    FROM subtasks WHERE task_id = ?
  `).get(row.id) as any;

  return {
    ...row,
    is_deleted:         Boolean(row.is_deleted),
    ai_suggested:       Boolean(row.ai_suggested),
    categories,
    tags,
    subtask_count:      Number(subCounts.total),
    completed_subtasks: Number(subCounts.done),
  };
}

function syncCategories(taskId: string, categoryIds: string[]): void {
  db.prepare('DELETE FROM task_categories WHERE task_id = ?').run(taskId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO task_categories (task_id, category_id) VALUES (?, ?)'
  );
  for (const cid of categoryIds) insert.run(taskId, cid);
}

function syncTags(taskId: string, tagIds: string[]): void {
  db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)'
  );
  for (const tid of tagIds) insert.run(taskId, tid);
}

// ══════════════════════════════════════════════════════════════
// IMPORTANT: Static/specific routes MUST come before /:id
// otherwise Express matches "reorder", "export" etc as an id.
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /tasks  — list with filters + pagination
// ─────────────────────────────────────────────
router.get('/', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.userId;
    const {
      status, priority, search, category_id, tag_id,
      page = '1', limit = '20',
      sort = 'order_index', order = 'ASC',
      due_from, due_to,
    } = req.query as Record<string, string>;

    const pg     = Math.max(1, parseInt(page));
    const lim    = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pg - 1) * lim;

    const ALLOWED_SORT = ['order_index', 'created_at', 'due_date', 'priority', 'title', 'updated_at'];
    const sortCol = ALLOWED_SORT.includes(sort) ? sort : 'order_index';
    const sortDir = order === 'DESC' ? 'DESC' : 'ASC';

    const conditions: string[] = ['t.user_id = ?', 't.is_deleted = 0'];
    const params: any[] = [uid];

    if (status && status !== 'all')     { conditions.push('t.status = ?');   params.push(status); }
    if (priority && priority !== 'all') { conditions.push('t.priority = ?'); params.push(priority); }
    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
      conditions.push('EXISTS (SELECT 1 FROM task_categories tc WHERE tc.task_id = t.id AND tc.category_id = ?)');
      params.push(category_id);
    }
    if (tag_id) {
      conditions.push('EXISTS (SELECT 1 FROM task_tags tt WHERE tt.task_id = t.id AND tt.tag_id = ?)');
      params.push(tag_id);
    }
    if (due_from) { conditions.push('t.due_date >= ?'); params.push(due_from); }
    if (due_to)   { conditions.push('t.due_date <= ?'); params.push(due_to); }

    const where = conditions.join(' AND ');

    const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM tasks t WHERE ${where}`)
      .get(...params) as any).cnt;

    const rows = db.prepare(
      `SELECT t.* FROM tasks t WHERE ${where}
       ORDER BY t.${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`
    ).all(...params, lim, offset) as any[];

    res.json({
      data: rows.map(buildTask),
      pagination: { total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) || 1 },
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// POST /tasks/reorder  ← MUST be before /:id
// ─────────────────────────────────────────────
router.post(
  '/reorder',
  [body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds must be a non-empty array')],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid = req.user!.userId;
      const { orderedIds } = req.body as { orderedIds: string[] };
      const update = db.prepare(
        'UPDATE tasks SET order_index = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      );
      db.exec('BEGIN');
      try {
        orderedIds.forEach((id: string, i: number) => update.run(i, now(), id, uid));
        db.exec('COMMIT');
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }
      res.json({ data: { message: 'Reordered successfully.' } });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// GET /tasks/export/snapshot  ← MUST be before /:id
// ─────────────────────────────────────────────
router.get('/export/snapshot', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND is_deleted = 0 ORDER BY order_index'
    ).all(req.user!.userId) as any[];
    res.json({ data: { tasks: rows.map(buildTask), exportedAt: now() } });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════
// Param routes — these come AFTER all static routes above
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET /tasks/:id
// ─────────────────────────────────────────────
router.get('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const row = db.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
    ).get(req.params.id, req.user!.userId) as any;
    if (!row) return next(createError('Task not found.', 404));
    res.json({ data: buildTask(row) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// POST /tasks
// ─────────────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('description').optional({ nullable: true }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('due_date').optional({ nullable: true }).isISO8601(),
    body('effort_estimate').optional().isInt({ min: 1 }),
    body('category_ids').optional().isArray(),
    body('tag_ids').optional().isArray(),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid = req.user!.userId;
      const { title, description, priority, due_date, effort_estimate, category_ids, tag_ids } =
        req.body as {
          title: string;
          description?: string | null;
          priority?: string;
          due_date?: string | null;
          effort_estimate?: number;
          category_ids?: string[];
          tag_ids?: string[];
        };

      const orderRow = db.prepare(
        'SELECT COALESCE(MAX(order_index), -1) + 1 AS next_idx FROM tasks WHERE user_id = ?'
      ).get(uid) as any;
      const orderIndex = Number(orderRow.next_idx);

      const taskId = uuidv4();
      const ts = now();

      db.prepare(`
        INSERT INTO tasks
          (id, user_id, title, description, priority, due_date, effort_estimate, order_index, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        taskId, uid, title,
        description ?? null,
        priority ?? 'medium',
        due_date ?? null,
        effort_estimate ?? 1,
        orderIndex, ts, ts
      );

      if (category_ids?.length) syncCategories(taskId, category_ids);
      if (tag_ids?.length)      syncTags(taskId, tag_ids);

      const task = buildTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any);

      logActivity({
        userId: uid, action: 'TASK_CREATED', entityType: 'task', entityId: taskId,
        newData: { title }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });

      notify(uid, 'TASK_CREATED', `Task created: "${title}"`,
        `Priority: ${priority ?? 'medium'}`);

      res.status(201).json({ data: task });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// PUT /tasks/:id
// ─────────────────────────────────────────────
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 500 }),
    body('description').optional({ nullable: true }),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'archived']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('due_date').optional({ nullable: true }).isISO8601(),
    body('effort_estimate').optional().isInt({ min: 1 }),
    body('category_ids').optional().isArray(),
    body('tag_ids').optional().isArray(),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid = req.user!.userId;
      const old = db.prepare(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
      ).get(req.params.id, uid) as any;
      if (!old) return next(createError('Task not found.', 404));

      const {
        title, description, status, priority,
        due_date, effort_estimate, category_ids, tag_ids,
      } = req.body as {
        title?: string; description?: string | null; status?: string;
        priority?: string; due_date?: string | null; effort_estimate?: number;
        category_ids?: string[]; tag_ids?: string[];
      };

      let completedAt = old.completed_at;
      if (status === 'completed' && !completedAt) completedAt = now();
      if (status && status !== 'completed')       completedAt = null;

      const ts = now();
      db.prepare(`
        UPDATE tasks SET
          title           = COALESCE(?, title),
          description     = COALESCE(?, description),
          status          = COALESCE(?, status),
          priority        = COALESCE(?, priority),
          due_date        = COALESCE(?, due_date),
          effort_estimate = COALESCE(?, effort_estimate),
          completed_at    = ?,
          updated_at      = ?
        WHERE id = ? AND user_id = ?
      `).run(
        title ?? null,
        description !== undefined ? description : null,
        status ?? null,
        priority ?? null,
        due_date !== undefined ? due_date : null,
        effort_estimate ?? null,
        completedAt, ts,
        req.params.id, uid
      );

      if (category_ids) syncCategories(req.params.id, category_ids);
      if (tag_ids)      syncTags(req.params.id, tag_ids);

      const task = buildTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any);

      logActivity({
        userId: uid, action: 'TASK_UPDATED', entityType: 'task', entityId: req.params.id,
        oldData: { title: old.title, status: old.status },
        newData: { title: task.title, status: task.status },
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
      });

      notify(uid, 'TASK_UPDATED', `Task updated: "${task.title}"`,
        status ? `Status changed to ${status}` : `Task details updated`);

      res.json({ data: task });
    } catch (err) { next(err); }
  }
);

// ─────────────────────────────────────────────
// PATCH /tasks/:id/toggle
// ─────────────────────────────────────────────
router.patch('/:id/toggle', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.userId;
    const old = db.prepare(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
    ).get(req.params.id, uid) as any;
    if (!old) return next(createError('Task not found.', 404));

    const isDone      = old.status === 'completed';
    const newStatus   = isDone ? 'pending' : 'completed';
    const completedAt = isDone ? null : now();
    const ts = now();

    db.prepare(
      'UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(newStatus, completedAt, ts, req.params.id, uid);

    // Notification: different message for complete vs reopen
    if (newStatus === 'completed') {
      notify(uid, 'TASK_COMPLETED', `Task completed! 🎉`, `"${old.title}" marked as done.`);
    } else {
      notify(uid, 'TASK_UPDATED', `Task reopened`, `"${old.title}" moved back to pending.`);
    }

    res.json({ data: buildTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────
// DELETE /tasks/:id  (soft delete)
// ─────────────────────────────────────────────
router.delete('/:id', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.userId;
    const row = db.prepare(
      'SELECT id, title FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
    ).get(req.params.id, uid) as any;
    if (!row) return next(createError('Task not found.', 404));

    db.prepare('UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(now(), req.params.id, uid);

    logActivity({
      userId: uid, action: 'TASK_DELETED', entityType: 'task', entityId: req.params.id,
      oldData: { title: row.title }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    notify(uid, 'TASK_DELETED', `Task deleted: "${row.title}"`,
      'The task was removed from your list.');

    res.json({ data: { message: 'Task deleted.' } });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════
// SUBTASKS — param routes, always after task-level routes
// ══════════════════════════════════════════════════════════════

// GET /tasks/:taskId/subtasks
router.get('/:taskId/subtasks', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = db.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
    ).get(req.params.taskId, req.user!.userId);
    if (!task) return next(createError('Task not found.', 404));

    const rows = db.prepare(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY order_index'
    ).all(req.params.taskId) as any[];

    res.json({ data: rows.map((s) => ({ ...s, is_completed: Boolean(s.is_completed) })) });
  } catch (err) { next(err); }
});

// POST /tasks/:taskId/subtasks
router.post(
  '/:taskId/subtasks',
  [body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 })],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const uid    = req.user!.userId;
      const taskId = req.params.taskId;

      const task = db.prepare(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
      ).get(taskId, uid);
      if (!task) return next(createError('Task not found.', 404));

      const orderRow = db.prepare(
        'SELECT COALESCE(MAX(order_index), -1) + 1 AS next_idx FROM subtasks WHERE task_id = ?'
      ).get(taskId) as any;

      const subId = uuidv4();
      const ts    = now();
      db.prepare(
        'INSERT INTO subtasks (id, task_id, title, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(subId, taskId, req.body.title, Number(orderRow.next_idx), ts, ts);

      const sub = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subId) as any;
      res.status(201).json({ data: { ...sub, is_completed: Boolean(sub.is_completed) } });
    } catch (err) { next(err); }
  }
);

// PATCH /tasks/:taskId/subtasks/:subId
router.patch(
  '/:taskId/subtasks/:subId',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 500 }),
    body('is_completed').optional().isBoolean(),
  ],
  validate,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { taskId, subId } = req.params;
      const task = db.prepare(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
      ).get(taskId, req.user!.userId);
      if (!task) return next(createError('Task not found.', 404));

      const { title, is_completed } = req.body as { title?: string; is_completed?: boolean };
      const ts = now();

      db.prepare(`
        UPDATE subtasks
        SET title        = COALESCE(?, title),
            is_completed = COALESCE(?, is_completed),
            updated_at   = ?
        WHERE id = ? AND task_id = ?
      `).run(
        title ?? null,
        is_completed !== undefined ? (is_completed ? 1 : 0) : null,
        ts, subId, taskId
      );

      const sub = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subId) as any;
      if (!sub) return next(createError('Subtask not found.', 404));
      res.json({ data: { ...sub, is_completed: Boolean(sub.is_completed) } });
    } catch (err) { next(err); }
  }
);

// DELETE /tasks/:taskId/subtasks/:subId
router.delete('/:taskId/subtasks/:subId', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId, subId } = req.params;
    const task = db.prepare(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND is_deleted = 0'
    ).get(taskId, req.user!.userId);
    if (!task) return next(createError('Task not found.', 404));

    const result = db.prepare('DELETE FROM subtasks WHERE id = ? AND task_id = ?').run(subId, taskId);
    if (result.changes === 0) return next(createError('Subtask not found.', 404));
    res.json({ data: { message: 'Subtask deleted.' } });
  } catch (err) { next(err); }
});

export default router;
