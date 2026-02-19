const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const collectionService = require('../services/collectionService');
const entryService = require('../services/entryService');

function resolveCollection(req, res, next) {
  try {
    req.collection = collectionService.getCollectionBySlug(req.params.slug);
    next();
  } catch (err) {
    next(err);
  }
}

// GET /api/content/:slug — List entries for a collection.
// Supports query params: status, filter.*, sort, page, per_page.
// Returns collection metadata alongside paginated entry data.
router.get('/:slug', resolveCollection, asyncHandler((req, res) => {
  const result = entryService.getEntries(req.collection, req.query);
  res.json({
    collection: {
      id: req.collection.id,
      name: req.collection.name,
      slug: req.collection.slug,
      description: req.collection.description,
      fields: req.collection.fields,
    },
    ...result,
  });
}));

// GET /api/content/:slug/:id — Get a single entry by ID within a collection.
router.get('/:slug/:id', resolveCollection, asyncHandler((req, res) => {
  const entry = entryService.getEntryById(req.collection, Number(req.params.id));
  res.json({
    collection: {
      id: req.collection.id,
      name: req.collection.name,
      slug: req.collection.slug,
      fields: req.collection.fields,
    },
    data: entry,
  });
}));

// POST /api/content/:slug — Create a new entry.
// Accepts { data, status }. Validates data against the collection's field definitions.
router.post('/:slug', resolveCollection, asyncHandler((req, res) => {
  const entry = entryService.createEntry(req.collection, req.body);
  res.status(201).json({ data: entry });
}));

// PUT /api/content/:slug/:id — Update an existing entry's data and/or status.
router.put('/:slug/:id', resolveCollection, asyncHandler((req, res) => {
  const entry = entryService.updateEntry(req.collection, Number(req.params.id), req.body);
  res.json({ data: entry });
}));

// DELETE /api/content/:slug/:id — Delete an entry. Returns 204 No Content.
router.delete('/:slug/:id', resolveCollection, asyncHandler((req, res) => {
  entryService.deleteEntry(req.collection, Number(req.params.id));
  res.status(204).send();
}));

module.exports = router;
