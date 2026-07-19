import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Лиды: SQLite через встроенный node:sqlite (Node 22+), без внешних зависимостей.
 * Файл живёт в data/ (в .gitignore). На проде это РФ-хостинг: требование 152-ФЗ.
 */

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dir = path.join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, 'leads.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'new',            -- partial|new|calling|qualified|activated|rejected|fraud
      phone TEXT NOT NULL,
      name TEXT,
      city TEXT,
      age INTEGER,
      citizenship TEXT,
      service TEXT,
      page TEXT,
      yclid TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      referrer TEXT,
      client_id TEXT,
      ip_hash TEXT,
      risk_score INTEGER NOT NULL DEFAULT 0,
      risk_flags TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE TABLE IF NOT EXISTS cta_intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      kind TEXT NOT NULL,
      page TEXT,
      client_id TEXT,
      yclid TEXT
    );
  `);
  return db;
}

export interface LeadRow {
  id: number;
  created_at: string;
  status: string;
  phone: string;
  name: string | null;
  city: string | null;
  age: number | null;
  citizenship: string | null;
  service: string | null;
  page: string | null;
  risk_score: number;
  risk_flags: string | null;
}
