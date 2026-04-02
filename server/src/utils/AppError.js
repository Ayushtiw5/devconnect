/**
 * Custom Error class for operational errors
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} errors - Array of detailed errors (for validation)
   */
  constructor(message, statusCode, errors = []) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
