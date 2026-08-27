import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Лиды: SQLite через встроенный node:sqlite (Node 22+), без внешних зависимостей.
 * Файл живёт в data/ (в .gitignore). На проде это РФ-хостинг: требование 152-ФЗ.
 *
 * Путь задаётся через LEADS_DATA_DIR. Это обязательно на проде: standalone-сборка
 * Next.js стартует из .next/standalone, и относительный путь увёл бы базу внутрь
 * .next, который стирается при каждой пересборке вместе со всеми заявками.
 */

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dir = process.env.LEADS_DATA_DIR || path.join(process.cwd(), 'data');
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
    CREATE TABLE IF NOT EXISTS telegram_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      update_id INTEGER,
      chat_id TEXT NOT NULL,
      from_id TEXT,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      text TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_messages_from ON telegram_messages(from_id);
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

export interface TelegramMessageRow {
  id: number;
  created_at: string;
  chat_id: string;
  from_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  text: string | null;
}
