import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import db  from './db/db';

const PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// ─────────────────────────────────────────────
// Verify DB on boot (synchronous — SQLite)
// ─────────────────────────────────────────────
try {
  db.prepare('SELECT 1').get();
  console.log('✅  SQLite ready.');
} catch (err) {
  console.error('❌  SQLite failed to open:', err);
  process.exit(1);
}

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀  Server  → http://localhost:${PORT}`);
  console.log(`🩺  Health  → http://localhost:${PORT}/api/health`);
  console.log(`📦  Mode    → ${process.env.NODE_ENV || 'development'}`);
});

// ─────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('HTTP server closed.');
    try { db.close(); console.log('SQLite closed.'); } catch { /* ignore */ }
    process.exit(0);
  });
  // Force-kill after 10 s if server hangs
  setTimeout(() => { console.error('Forced exit after timeout.'); process.exit(1); }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─────────────────────────────────────────────
// Safety nets — catch bugs that escape try/catch
// These log the crash but keep the process alive
// in development; in production they shut down
// cleanly (let a process manager restart it).
// ─────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err.message);
  if (err.stack) console.error(err.stack);
  if (!isDev) { shutdown('uncaughtException'); }
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Promise Rejection:', reason);
  if (!isDev) { shutdown('unhandledRejection'); }
});
