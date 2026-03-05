import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bard.db');

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    db = drizzle(sqlite, { schema });
    
    // Initialize schema
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS poems (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS versions (
          id INTEGER PRIMARY KEY,
          poem_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(poem_id) REFERENCES poems(id)
        );

        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY,
          poem_id INTEGER NOT NULL,
          label TEXT NOT NULL,
          FOREIGN KEY(poem_id) REFERENCES poems(id)
        );
      `);
    } catch (e) {
      // Tables might already exist
    }
  }
  return db;
}
