const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

let db;

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

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

  db.exec('CREATE INDEX IF NOT EXISTS idx_entries_collection_id ON entries(collection_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug)');
}

module.exports = { getDb, initDatabase };
