/**
 * SQLite database connection using Node.js built-in node:sqlite
 * Available since Node 22.5, fully stable in Node 26.
 * Zero npm packages needed.
 */

// node:sqlite ships with Node 22+; TypeScript doesn't have official
// types yet so we import with require and type-cast.
import path from 'path';
import fs   from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../data/mscit_todo.db');

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Performance + safety pragmas
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous  = NORMAL;
`);

console.log(`SQLite database: ${dbPath}`);

export default db;
