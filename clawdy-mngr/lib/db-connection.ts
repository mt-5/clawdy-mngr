import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './db';
import path from 'path';
import fs from 'fs';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/db.sqlite';
const dbPath = databaseUrl.replace('file:', '');

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export { schema };
