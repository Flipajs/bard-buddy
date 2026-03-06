import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const runtime = 'nodejs';

function getDb() {
  const dbPath = path.join(process.cwd(), 'bard.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
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

  return db;
}

export async function POST(req: NextRequest) {
  try {
    const { action, poemId, content, title } = (await req.json()) as {
      action: string;
      poemId?: number;
      content?: string;
      title?: string;
    };

    const db = getDb();

    if (action === 'create-poem') {
      const stmt = db.prepare(
        'INSERT INTO poems (title, created_at, updated_at) VALUES (?, ?, ?)'
      );
      const now = Date.now();
      const result = stmt.run(title || 'Untitled', now, now);
      return NextResponse.json({
        success: true,
        poemId: result.lastInsertRowid,
      });
    }

    if (action === 'save-version') {
      if (!poemId || !content) {
        return NextResponse.json(
          { error: 'poemId and content are required' },
          { status: 400 }
        );
      }

      const stmt = db.prepare(
        'INSERT INTO versions (poem_id, content, created_at) VALUES (?, ?, ?)'
      );
      stmt.run(poemId, content, Date.now());

      const updateStmt = db.prepare('UPDATE poems SET updated_at = ? WHERE id = ?');
      updateStmt.run(Date.now(), poemId);

      return NextResponse.json({ success: true });
    }

    if (action === 'get-versions') {
      if (!poemId) {
        return NextResponse.json(
          { error: 'poemId is required' },
          { status: 400 }
        );
      }

      const stmt = db.prepare(
        'SELECT id, content, created_at FROM versions WHERE poem_id = ? ORDER BY created_at DESC LIMIT 5'
      );
      const versions = stmt.all(poemId) as Array<{
        id: number;
        content: string;
        created_at: number;
      }>;

      return NextResponse.json({ success: true, versions });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Versions API error:', error);
    return NextResponse.json(
      { error: 'Failed to manage versions' },
      { status: 500 }
    );
  }
}
