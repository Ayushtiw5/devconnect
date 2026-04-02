/**
 * Wraps async functions to catch errors and pass to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
