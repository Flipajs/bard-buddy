import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const runtime = 'nodejs';

function getDb() {
  const dbPath = path.join(process.cwd(), 'bard.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS references_library (
      id INTEGER PRIMARY KEY,
      poem_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(poem_id) REFERENCES poems(id)
    );
  `);

  const columns = db.prepare("PRAGMA table_info(references_library)").all() as Array<{ name: string }>;
  const hasAuthor = columns.some((c) => c.name === 'author');
  if (!hasAuthor) {
    db.exec("ALTER TABLE references_library ADD COLUMN author TEXT NOT NULL DEFAULT ''");
  }

  return db;
}

export async function POST(req: NextRequest) {
  try {
    const { action, poemId, id, title, author, content } = (await req.json()) as {
      action: 'list' | 'add' | 'delete' | 'export-all';
      poemId?: number;
      id?: number;
      title?: string;
      author?: string;
      content?: string;
    };

    const db = getDb();

    if (action === 'list') {
      if (!poemId) {
        return NextResponse.json({ error: 'poemId is required' }, { status: 400 });
      }

      const rows = db
        .prepare('SELECT id, title, author, content, created_at FROM references_library WHERE poem_id = ? ORDER BY created_at DESC')
        .all(poemId);
      return NextResponse.json({ success: true, references: rows });
    }

    if (action === 'add') {
      if (!poemId || !title?.trim() || !content?.trim()) {
        return NextResponse.json(
          { error: 'poemId, title and content are required' },
          { status: 400 }
        );
      }

      const result = db
        .prepare('INSERT INTO references_library (poem_id, title, author, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(poemId, title.trim(), (author || '').trim(), content.trim(), Date.now());

      return NextResponse.json({ success: true, id: result.lastInsertRowid });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
      }

      db.prepare('DELETE FROM references_library WHERE id = ?').run(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'export-all') {
      const rows = db
        .prepare(`
          SELECT
            r.id,
            r.poem_id,
            p.title as poem_title,
            r.title,
            r.author,
            r.content,
            r.created_at
          FROM references_library r
          LEFT JOIN poems p ON p.id = r.poem_id
          ORDER BY r.created_at DESC
        `)
        .all();

      return NextResponse.json({
        success: true,
        exportedAt: Date.now(),
        count: rows.length,
        references: rows,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('References API error:', error);
    return NextResponse.json({ error: 'Failed to manage references' }, { status: 500 });
  }
}
