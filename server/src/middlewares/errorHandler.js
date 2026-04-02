const config = require('../config');
const { sendError } = require('../utils/responseHelpers');

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return { statusCode: 400, message };
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists`;
  return { statusCode: 409, message };
};

/**
 * Handle Mongoose validation error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return { statusCode: 400, message: 'Validation failed', errors };
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => ({
  statusCode: 401,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpiredError = () => ({
  statusCode: 401,
  message: 'Token expired. Please log in again.',
});

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Log error in development (always log, even if not in dev)
  console.error('ERROR 💥:', err.stack || err);

  // Handle specific error types
  if (err.name === 'CastError') {
    const handled = handleCastErrorDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.code === 11000) {
    const handled = handleDuplicateFieldsDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === 'ValidationError') {
    const handled = handleValidationErrorDB(err);
    statusCode = handled.statusCode;
    message = handled.message;
    errors = handled.errors;
  }

  if (err.name === 'JsonWebTokenError') {
    const handled = handleJWTError();
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (err.name === 'TokenExpiredError') {
    const handled = handleJWTExpiredError();
    statusCode = handled.statusCode;
    message = handled.message;
  }

  // Don't leak error details in production for 500 errors
  if (config.env === 'production' && statusCode === 500 && !err.isOperational) {
    message = 'Something went wrong. Please try again later.';
    errors = [];
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorHandler;
