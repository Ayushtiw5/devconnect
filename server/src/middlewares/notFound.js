const AppError = require('../utils/AppError');

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = notFound;
