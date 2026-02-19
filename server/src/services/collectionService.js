const { getDb } = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');


function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove special characters
    .replace(/[\s_]+/g, '-')    // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-')        // Collapse consecutive hyphens
    .replace(/^-|-$/g, '');     // Trim leading/trailing hyphens
}

function parseCollection(row) {
  if (!row) return null;
  return {
    ...row,
    fields: JSON.parse(row.fields),
  };
}

function getAllCollections() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, COUNT(e.id) as entry_count
    FROM collections c
    LEFT JOIN entries e ON e.collection_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all();
  return rows.map(parseCollection);
}

function getCollectionBySlug(slug) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM collections WHERE slug = ?').get(slug);
  if (!row) throw new NotFoundError(`Collection "${slug}" not found`);
  return parseCollection(row);
}

function getCollectionById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
  if (!row) throw new NotFoundError(`Collection with id ${id} not found`);
  return parseCollection(row);
}

function createCollection({ name, description, fields }) {
  if (!name || !name.trim()) {
    throw new ValidationError('Collection name is required');
  }

  const db = getDb();
  const slug = slugify(name);

  // Ensure no other collection already uses this slug
  const existing = db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug);
  if (existing) {
    throw new ValidationError(`A collection with slug "${slug}" already exists`);
  }

  const result = db.prepare(`
    INSERT INTO collections (name, slug, description, fields)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), slug, description || '', JSON.stringify(fields || []));

  return getCollectionById(result.lastInsertRowid);
}

function updateCollection(id, { name, description, fields }) {
  const db = getDb();
  const existing = getCollectionById(id); // throws 404 if not found

  // Merge provided values with existing ones
  const updatedName = name !== undefined ? name.trim() : existing.name;
  const updatedSlug = name !== undefined ? slugify(name) : existing.slug;
  const updatedDescription = description !== undefined ? description : existing.description;
  const updatedFields = fields !== undefined ? fields : existing.fields;

  // If name changed, check the new slug doesn't collide with another collection
  if (name !== undefined) {
    const slugConflict = db.prepare('SELECT id FROM collections WHERE slug = ? AND id != ?').get(updatedSlug, id);
    if (slugConflict) {
      throw new ValidationError(`A collection with slug "${updatedSlug}" already exists`);
    }
  }

  db.prepare(`
    UPDATE collections
    SET name = ?, slug = ?, description = ?, fields = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(updatedName, updatedSlug, updatedDescription, JSON.stringify(updatedFields), id);

  return getCollectionById(id);
}

function deleteCollection(id) {
  const db = getDb();
  getCollectionById(id); // throws if not found
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
}

module.exports = {
  getAllCollections,
  getCollectionBySlug,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
