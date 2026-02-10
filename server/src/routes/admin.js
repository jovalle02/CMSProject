/**
 * Admin API routes — manages collections (content type schemas).
 *
 * All routes are prefixed with /api/admin (mounted in index.js).
 * These endpoints let the admin create, read, update, and delete
 * collections, which define the structure (fields) that entries
 * must conform to.
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const collectionService = require('../services/collectionService');
const { validateFieldDefinitions } = require('../services/validationService');

// GET /api/admin/collections — List all collections (with entry counts)
router.get('/collections', asyncHandler((req, res) => {
  const collections = collectionService.getAllCollections();
  res.json({ data: collections });
}));

// GET /api/admin/collections/:id — Get a single collection by its numeric ID
router.get('/collections/:id', asyncHandler((req, res) => {
  const collection = collectionService.getCollectionById(Number(req.params.id));
  res.json({ data: collection });
}));

// POST /api/admin/collections — Create a new collection.
// Accepts { name, description, fields }. Validates field definitions
// before passing to the service layer. Returns 201 on success.
router.post('/collections', asyncHandler((req, res) => {
  const { name, description, fields } = req.body;
  if (fields && fields.length > 0) {
    validateFieldDefinitions(fields);
  }
  const collection = collectionService.createCollection({ name, description, fields });
  res.status(201).json({ data: collection });
}));

// PUT /api/admin/collections/:id — Update an existing collection.
// Only provided fields are overwritten; omitted fields keep their current value.
router.put('/collections/:id', asyncHandler((req, res) => {
  const { name, description, fields } = req.body;
  if (fields) {
    validateFieldDefinitions(fields);
  }
  const collection = collectionService.updateCollection(Number(req.params.id), { name, description, fields });
  res.json({ data: collection });
}));

// DELETE /api/admin/collections/:id — Delete a collection and all its entries (cascade).
// Returns 204 No Content on success.
router.delete('/collections/:id', asyncHandler((req, res) => {
  collectionService.deleteCollection(Number(req.params.id));
  res.status(204).send();
}));

module.exports = router;
