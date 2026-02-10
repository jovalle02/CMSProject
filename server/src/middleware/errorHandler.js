/**
 * Global Express error-handling middleware.
 *
 * Catches all errors thrown or passed via next(err) from route handlers.
 * Reads statusCode from custom AppError subclasses (defaults to 500).
 * Returns a consistent JSON shape: { error: { message, details? } }.
 * Logs stack traces for unexpected 500 errors in non-production environments.
 */

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.message || 'Internal server error',
    },
  };

  // Include field-level validation details if present (from ValidationError)
  if (err.details) {
    response.error.details = err.details;
  }

  // Log full stack trace for unexpected server errors during development
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
