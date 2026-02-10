/**
 * Entry service — business logic for managing content entries.
 *
 * Entries are the actual content records that belong to a collection.
 * Each entry stores its data as a JSON blob validated against the
 * parent collection's field definitions, plus a status (draft/published).
 */

const { getDb } = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { validateEntryData } = require('./validationService');
const { buildQuery } = require('../utils/queryBuilder');

/**
 * Converts a raw database row into an entry object by parsing
 * the JSON-encoded "data" column into a real object.
 */
function parseEntry(row) {
  if (!row) return null;
  return {
    ...row,
    data: JSON.parse(row.data),
  };
}

/**
 * Lists entries for a collection with filtering, sorting, and pagination.
 *
 * Query params supported:
 *   - status        — filter by "draft" or "published"
 *   - filter.<field> — filter by a JSON field value (e.g. filter.category=tech)
 *   - sort          — sort column, prefix with "-" for descending (e.g. -created_at)
 *   - page          — page number (default 1)
 *   - per_page      — results per page (default 20, max 100)
 *
 * Returns { data: Entry[], pagination: { page, per_page, total, total_pages } }.
 */
function getEntries(collection, query = {}) {
  const db = getDb();

  // Extract filter.* query params into a plain object (e.g. { category: "tech" })
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filter.')) {
      filters[key.slice(7)] = value;
    }
  }

  // Build dynamic SQL clauses from the query parameters
  const { whereClause, orderClause, limit, offset, params, currentPage } = buildQuery({
    status: query.status,
    filters,
    sort: query.sort,
    page: query.page,
    perPage: query.per_page,
  });

  // Count total matching entries (for pagination metadata)
  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM entries e
    WHERE e.collection_id = ? ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
  `).get(collection.id, ...params);

  // Fetch the current page of entries
  const rows = db.prepare(`
    SELECT e.* FROM entries e
    WHERE e.collection_id = ? ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
    ${orderClause}
    LIMIT ? OFFSET ?
  `).all(collection.id, ...params, limit, offset);

  return {
    data: rows.map(parseEntry),
    pagination: {
      page: currentPage,
      per_page: limit,
      total: countRow.total,
      total_pages: Math.ceil(countRow.total / limit),
    },
  };
}

/**
 * Fetches a single entry by ID, scoped to the given collection.
 * Throws NotFoundError if the entry doesn't exist or belongs to a different collection.
 */
function getEntryById(collection, id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM entries WHERE id = ? AND collection_id = ?').get(id, collection.id);
  if (!row) throw new NotFoundError(`Entry with id ${id} not found in "${collection.name}"`);
  return parseEntry(row);
}

/**
 * Creates a new entry in the given collection.
 * Validates the data against the collection's field definitions,
 * defaults status to "draft" unless explicitly "published",
 * inserts the row, and returns the full new entry.
 */
function createEntry(collection, { data, status }) {
  const db = getDb();
  const cleanedData = validateEntryData(collection.fields, data || {});
  const entryStatus = status === 'published' ? 'published' : 'draft';

  const result = db.prepare(`
    INSERT INTO entries (collection_id, data, status)
    VALUES (?, ?, ?)
  `).run(collection.id, JSON.stringify(cleanedData), entryStatus);

  return getEntryById(collection, result.lastInsertRowid);
}

/**
 * Updates an existing entry. Only overwrites data/status if explicitly
 * provided — omitted fields keep their current values.
 * Re-validates data against the collection's field definitions if changed.
 * Returns the updated entry.
 */
function updateEntry(collection, id, { data, status }) {
  const db = getDb();
  const existing = getEntryById(collection, id); // throws 404 if not found

  const updatedData = data !== undefined ? validateEntryData(collection.fields, data) : existing.data;
  const updatedStatus = status !== undefined ? (status === 'published' ? 'published' : 'draft') : existing.status;

  db.prepare(`
    UPDATE entries SET data = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND collection_id = ?
  `).run(JSON.stringify(updatedData), updatedStatus, id, collection.id);

  return getEntryById(collection, id);
}

/**
 * Deletes an entry by ID within a collection.
 * Verifies the entry exists first (throws 404 if not).
 */
function deleteEntry(collection, id) {
  const db = getDb();
  getEntryById(collection, id); // throws if not found
  db.prepare('DELETE FROM entries WHERE id = ? AND collection_id = ?').run(id, collection.id);
}

module.exports = { getEntries, getEntryById, createEntry, updateEntry, deleteEntry };
