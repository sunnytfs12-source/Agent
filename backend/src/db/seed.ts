/**
 * Database Seed — node:sqlite
 * Run with:  npm run db:seed
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db';

function now(): string { return new Date().toISOString(); }

async function seed() {
  console.log('🌱 Seeding database...');

  const email    = 'admin@mscit.dev';
  const password = 'Admin@1234';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('ℹ️  Superadmin already exists — skipped.');
    db.close();
    process.exit(0);
  }

  const hash   = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const ts     = now();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'superadmin', 1, ?, ?)
  `).run(userId, 'Super Admin', email, hash, ts, ts);

  // Default categories
  for (const c of [
    { name: 'Work',     color: '#6366f1', icon: 'briefcase' },
    { name: 'Personal', color: '#10b981', icon: 'person'    },
    { name: 'Study',    color: '#f59e0b', icon: 'book'      },
  ]) {
    db.prepare(`
      INSERT INTO categories (id, user_id, name, color, icon, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(uuidv4(), userId, c.name, c.color, c.icon, ts);
  }

  // Default tags
  for (const t of [
    { name: 'urgent', color: '#ef4444' },
    { name: 'review', color: '#8b5cf6' },
  ]) {
    db.prepare(`
      INSERT INTO tags (id, user_id, name, color, is_default, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(uuidv4(), userId, t.name, t.color, ts);
  }

  // Welcome notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, created_at)
    VALUES (?, ?, 'welcome', ?, ?, ?)
  `).run(uuidv4(), userId, 'Welcome to MSCIT Todo! 🎉', 'Start by creating your first task.', ts);

  console.log(`✅ Superadmin created: ${email} / ${password}`);
  console.log('✅ Seed complete.');
  db.close();
  process.exit(0);
}

seed();
