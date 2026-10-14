import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, google_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, email TEXT NOT NULL, credits INTEGER NOT NULL DEFAULT 100 CHECK(credits >= 0),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS oauth_states (
      state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, nonce TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('image', 'video')), prompt TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'starting', prediction_id TEXT,
      model TEXT NOT NULL, cost INTEGER NOT NULL, refunded INTEGER NOT NULL DEFAULT 0,
      favorite INTEGER NOT NULL DEFAULT 0, media_file TEXT, media_type TEXT, error TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS generations_by_user ON generations(user_id, created_at DESC);
  `);
  return db;
}

export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function publicGeneration(row) {
  return {
    id: row.id, type: row.type, prompt: row.prompt, aspectRatio: row.aspect_ratio,
    status: row.status, model: row.model, cost: row.cost, refunded: Boolean(row.refunded),
    favorite: Boolean(row.favorite), error: row.error, createdAt: row.created_at,
    mediaUrl: row.media_file ? `/api/generations/${row.id}/media` : null,
  };
}
