
const { ValidationError } = require('../utils/errors');

const VALID_TYPES = ['string', 'text', 'number', 'boolean', 'select', 'date', 'markdown'];

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
