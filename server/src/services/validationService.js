/**
 * Validation service — validates both collection field definitions
 * (the schema) and entry data (the content).
 *
 * Field definitions describe what fields a collection has and their types.
 * Entry data is the actual content submitted by users, which must conform
 * to the collection's field definitions.
 */

const { ValidationError } = require('../utils/errors');

// All supported field types for collection schemas
const VALID_TYPES = ['string', 'text', 'number', 'boolean', 'select', 'date', 'markdown'];

/**
 * Validates the field definitions array when creating or updating a collection.
 * Checks that:
 *   - fields is an array
 *   - Every field has a non-empty, unique name
 *   - Every field has a valid type from VALID_TYPES
 *   - "select" fields include a non-empty options array
 *
 * Collects all errors and throws a single ValidationError with details.
 */
function validateFieldDefinitions(fields) {
  const errors = [];

  if (!Array.isArray(fields)) {
    throw new ValidationError('Fields must be an array');
  }

  const names = new Set(); // Track field names to detect duplicates
  fields.forEach((field, i) => {
    if (!field.name || !field.name.trim()) {
      errors.push({ field: `fields[${i}].name`, message: 'Field name is required' });
    } else if (names.has(field.name)) {
      errors.push({ field: `fields[${i}].name`, message: `Duplicate field name "${field.name}"` });
    } else {
      names.add(field.name);
    }

    if (!field.type || !VALID_TYPES.includes(field.type)) {
      errors.push({ field: `fields[${i}].type`, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    if (field.type === 'select') {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        errors.push({ field: `fields[${i}].options`, message: 'Select fields must have at least one option' });
      }
    }
  });

  if (errors.length > 0) {
    throw new ValidationError('Invalid field definitions', errors);
  }
}

/**
 * Validates entry data against a collection's field definitions.
 *
 * For each field defined in the collection:
 *   1. Checks required fields are present and non-empty
 *   2. Applies defaults for missing optional fields
 *   3. Validates the value against the field's type:
 *      - string:   must be a string, optionally enforces maxLength
 *      - text/markdown: must be a string (no length limit)
 *      - number:   must be numeric, optionally enforces min/max
 *      - boolean:  coerced via Boolean()
 *      - select:   must match one of the predefined options
 *      - date:     must be a parseable date string
 *
 * Returns a "cleaned" object containing only validated field values
 * (any extra keys not in the schema are stripped out).
 * Throws ValidationError with field-level details if any checks fail.
 */
function validateEntryData(fields, data) {
  const errors = [];
  const cleaned = {}; // Only validated values make it into this object

  for (const field of fields) {
    const value = data[field.name];

    // Required check — reject empty/missing values for required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: field.name, message: `${field.label || field.name} is required` });
      continue;
    }

    // Apply defaults for missing optional fields and skip further validation
    if (value === undefined || value === null || value === '') {
      if (field.default !== undefined) {
        cleaned[field.name] = field.default;
      } else {
        cleaned[field.name] = field.type === 'boolean' ? false : '';
      }
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case 'string': {
        if (typeof value !== 'string') {
          errors.push({ field: field.name, message: `${field.label || field.name} must be a string` });
        } else {
          if (field.maxLength && value.length > field.maxLength) {
            errors.push({ field: field.name, message: `${field.label || field.name} must be at most ${field.maxLength} characters` });
          }
          cleaned[field.name] = value;
        }
        break;
      }

      case 'text':
      case 'markdown': {
        if (typeof value !== 'string') {
          errors.push({ field: field.name, message: `${field.label || field.name} must be a string` });
        } else {
          cleaned[field.name] = value;
        }
        break;
      }

      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ field: field.name, message: `${field.label || field.name} must be a number` });
        } else {
          if (field.min !== undefined && num < field.min) {
            errors.push({ field: field.name, message: `${field.label || field.name} must be at least ${field.min}` });
          }
          if (field.max !== undefined && num > field.max) {
            errors.push({ field: field.name, message: `${field.label || field.name} must be at most ${field.max}` });
          }
          cleaned[field.name] = num;
        }
        break;
      }

      case 'boolean': {
        cleaned[field.name] = Boolean(value);
        break;
      }

      case 'select': {
        // Value must be one of the predefined options
        if (!field.options || !field.options.includes(value)) {
          errors.push({ field: field.name, message: `${field.label || field.name} must be one of: ${(field.options || []).join(', ')}` });
        } else {
          cleaned[field.name] = value;
        }
        break;
      }

      case 'date': {
        // Must be a string that JavaScript's Date.parse can understand
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          errors.push({ field: field.name, message: `${field.label || field.name} must be a valid date` });
        } else {
          cleaned[field.name] = value;
        }
        break;
      }

      default:
        // Unknown types are passed through as-is
        cleaned[field.name] = value;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return cleaned;
}

module.exports = { validateEntryData, validateFieldDefinitions };
