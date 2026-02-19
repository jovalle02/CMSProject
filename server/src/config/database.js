/**
 * Database configuration and connection layer.
 *
 * Uses Node.js built-in `node:sqlite` (DatabaseSync) which provides a
 * synchronous SQLite API similar to better-sqlite3 — no native compilation
 * or WASM needed.
 *
 * Exports:
 *   - initDatabase()  — synchronous; opens or creates the DB file,
 *                        enables foreign keys, and creates tables/indexes.
 *   - getDb()         — returns the DatabaseSync instance (must call initDatabase first).
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let db; // DatabaseSync singleton

/**
 * Returns the DatabaseSync singleton.
 * Throws if initDatabase() hasn't been called yet.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Opens (or creates) the SQLite database file, enables foreign keys,
 * and creates the collections and entries tables plus performance indexes.
 * Synchronous — call once at startup before handling requests.
 */
function initDatabase() {
  if (db) return; // Already initialized

  const dbFilePath = process.env.DB_PATH || './data/cms.db';
  const dbPath = path.resolve(__dirname, '../../', dbFilePath);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');

  // Collections table: stores content type definitions.
  // The "fields" column holds a JSON array describing each field's name, type,
  // validation rules, etc. This is what makes the CMS "dynamic" — the schema
  // is data, not code.
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      fields TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Entries table: stores actual content data.
  // The "data" column holds a JSON object whose keys correspond to the
  // field names defined in the parent collection's "fields" array.
  // Cascade delete ensures entries are removed when their collection is deleted.
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
  `);

  // Indexes for common query patterns
  db.exec('CREATE INDEX IF NOT EXISTS idx_entries_collection_id ON entries(collection_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug)');
}

module.exports = { getDb, initDatabase };
