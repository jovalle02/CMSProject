const { getDb } = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const { validateEntryData } = require('./validationService');
const { buildQuery } = require('../utils/queryBuilder');


function parseEntry(row) {
  if (!row) return null;
  return {
    ...row,
    data: JSON.parse(row.data),
  };
}

function getEntries(collection, query = {}) {
  const db = getDb();

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


function getEntryById(collection, id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM entries WHERE id = ? AND collection_id = ?').get(id, collection.id);
  if (!row) throw new NotFoundError(`Entry with id ${id} not found in "${collection.name}"`);
  return parseEntry(row);
}

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

function deleteEntry(collection, id) {
  const db = getDb();
  getEntryById(collection, id); // throws if not found
  db.prepare('DELETE FROM entries WHERE id = ? AND collection_id = ?').run(id, collection.id);
}

module.exports = { getEntries, getEntryById, createEntry, updateEntry, deleteEntry };
