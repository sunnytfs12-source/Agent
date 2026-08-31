import { v4 as uuidv4 } from 'uuid';
import db from '../db/db';

interface LogOptions {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

/** Fire-and-forget activity logger — never throws */
export function logActivity(opts: LogOptions): void {
  try {
    db.prepare(`
      INSERT INTO activity_logs
        (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      opts.userId     ?? null,
      opts.action,
      opts.entityType ?? null,
      opts.entityId   ?? null,
      opts.oldData    ? JSON.stringify(opts.oldData) : null,
      opts.newData    ? JSON.stringify(opts.newData) : null,
      opts.ipAddress  ?? null,
      opts.userAgent  ?? null,
      new Date().toISOString()
    );
  } catch (err) {
    console.warn('Activity log write failed (non-fatal):', err);
  }
}
