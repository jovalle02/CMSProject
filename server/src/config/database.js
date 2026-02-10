/**
 * Database configuration and connection layer.
 *
 * Uses sql.js (a pure-JS WASM build of SQLite) instead of better-sqlite3
 * so the project can run without native C++ compilation tools.
 * Provides a DbWrapper class that exposes a better-sqlite3-like synchronous
 * API (prepare/run/get/all/exec) on top of the sql.js in-memory engine,
 * with automatic persistence to disk after every write.
 *
 * Exports:
 *   - initDatabase()  — async; loads the WASM engine, opens or creates the
 *                        DB file, and creates tables/indexes.
 *   - getDb()         — returns the DbWrapper singleton (must call initDatabase first).
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db;        // DbWrapper singleton
let dbPath;    // Resolved absolute path to the .db file
let initPromise; // Ensures initialization runs only once

/**
 * Compatibility wrapper around a sql.js Database.
 * Mimics the better-sqlite3 API so the rest of the codebase can call
 * db.prepare(sql).run/get/all without knowing the underlying engine.
 */
class DbWrapper {
  constructor(sqlDb, filePath) {
    this._db = sqlDb;         // The raw sql.js Database instance (in-memory)
    this._filePath = filePath; // Where to persist the database on disk
  }

  /**
   * Exports the in-memory database to a Buffer and writes it to disk.
   * Called automatically after every write operation (run/exec).
   */
  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this._filePath, buffer);
  }

  /**
   * Prepares a SQL statement and returns an object with run/get/all methods,
   * matching the better-sqlite3 prepared statement interface.
   */
  prepare(sql) {
    const self = this;
    return {
      /**
       * Executes a write statement (INSERT/UPDATE/DELETE).
       * Reads last_insert_rowid() BEFORE saving to disk (important for correctness),
       * then persists the database.
       * Returns { lastInsertRowid, changes }.
       */
      run(...params) {
        self._db.run(sql, params);
        const lastIdResult = self._db.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 0;
        const changes = self._db.getRowsModified();
        self._save();
        return {
          lastInsertRowid,
          changes,
        };
      },
      /**
       * Executes a SELECT and returns the first matching row as a plain
       * { column: value } object, or undefined if no rows match.
       */
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      /**
       * Executes a SELECT and returns all matching rows as an array
       * of plain { column: value } objects.
       */
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  /**
   * Executes raw SQL (typically DDL like CREATE TABLE) and saves to disk.
   */
  exec(sql) {
    this._db.run(sql);
    this._save();
  }
}

/**
 * Loads the sql.js WASM engine, opens an existing database file (or creates
 * a new one), wraps it in DbWrapper, and enables foreign key enforcement.
 */
async function initEngine() {
  const SQL = await initSqlJs();
  const dbFilePath = process.env.DB_PATH || './data/cms.db';
  dbPath = path.resolve(__dirname, '../../', dbFilePath);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    // Load existing database from file into memory
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    // Create a brand-new empty database
    sqlDb = new SQL.Database();
  }

  db = new DbWrapper(sqlDb, dbPath);
  db.exec('PRAGMA foreign_keys = ON');
}

/**
 * Returns the DbWrapper singleton.
 * Throws if initDatabase() hasn't been called yet.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Public initialization function. Ensures the WASM engine is loaded (only once),
 * then creates the collections and entries tables plus performance indexes.
 * Must be awaited before the server starts handling requests.
 */
async function initDatabase() {
  if (!initPromise) {
    initPromise = initEngine();
  }
  await initPromise;

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
