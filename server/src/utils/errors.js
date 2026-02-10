/**
 * Custom error classes for consistent HTTP error handling.
 *
 * All errors extend AppError, which carries an HTTP statusCode.
 * The global error handler middleware reads statusCode and details
 * from these errors to build the JSON response.
 */

/**
 * Base application error. Carries an HTTP status code (defaults to 500).
 * Extend this for specific error types.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * 404 Not Found — thrown when a requested resource (collection or entry)
 * doesn't exist in the database.
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 400 Bad Request — thrown when input fails validation.
 * Optionally carries a "details" array of field-level error objects
 * (e.g. [{ field: "title", message: "Title is required" }]).
 */
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
  }
}

module.exports = { AppError, NotFoundError, ValidationError };
