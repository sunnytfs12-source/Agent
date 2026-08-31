/**
 * Database Migration — node:sqlite
 * Run with:  npm run db:migrate
 */

import dotenv from 'dotenv';
dotenv.config();

import db from './db';

db.exec(`
  -- ─────────────────────────────────────────
  -- USERS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT    PRIMARY KEY,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user','admin','superadmin')),
    is_active     INTEGER NOT NULL DEFAULT 1,
    theme         TEXT    DEFAULT 'dark',
    avatar_url    TEXT,
    preferences   TEXT    DEFAULT '{}',
    last_login    TEXT,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  -- ─────────────────────────────────────────
  -- REFRESH TOKENS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

  -- ─────────────────────────────────────────
  -- CATEGORIES
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS categories (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#6366f1',
    icon       TEXT    NOT NULL DEFAULT 'folder',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

  -- ─────────────────────────────────────────
  -- TAGS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS tags (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#8b5cf6',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

  -- ─────────────────────────────────────────
  -- TASKS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS tasks (
    id              TEXT    PRIMARY KEY,
    user_id         TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    description     TEXT,
    status          TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','in_progress','completed','archived')),
    priority        TEXT    NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
    due_date        TEXT,
    completed_at    TEXT,
    order_index     INTEGER NOT NULL DEFAULT 0,
    effort_estimate INTEGER NOT NULL DEFAULT 1,
    ai_suggested    INTEGER NOT NULL DEFAULT 0,
    ai_metadata     TEXT    DEFAULT '{}',
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_user     ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
  CREATE INDEX IF NOT EXISTS idx_tasks_deleted  ON tasks(user_id, is_deleted);

  -- ─────────────────────────────────────────
  -- TASK ↔ CATEGORY
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS task_categories (
    task_id     TEXT NOT NULL REFERENCES tasks(id)      ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, category_id)
  );

  -- ─────────────────────────────────────────
  -- TASK ↔ TAG
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS task_tags (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
  );

  -- ─────────────────────────────────────────
  -- SUBTASKS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS subtasks (
    id           TEXT    PRIMARY KEY,
    task_id      TEXT    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title        TEXT    NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    order_index  INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);

  -- ─────────────────────────────────────────
  -- NOTIFICATIONS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT    NOT NULL DEFAULT 'info',
    title      TEXT    NOT NULL,
    message    TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    metadata   TEXT    DEFAULT '{}',
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_notif_user   ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read);

  -- ─────────────────────────────────────────
  -- ACTIVITY LOGS
  -- ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS activity_logs (
    id          TEXT PRIMARY KEY,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    old_data    TEXT,
    new_data    TEXT,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_activity_user   ON activity_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);
`);

console.log('✅ Migration complete — all tables created.');
db.close();
process.exit(0);
