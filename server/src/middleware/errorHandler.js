function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.message || 'Internal server error',
    },
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
