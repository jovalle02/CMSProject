/**
 * Async route handler wrapper.
 *
 * Express doesn't natively catch errors from async route handlers —
 * if an async function throws or its promise rejects, the error is
 * silently swallowed. This wrapper catches any rejection and forwards
 * it to next(), which sends it to the global error handler middleware.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
