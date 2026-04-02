const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Protect routes - Verify JWT and attach user to request
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated.', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

/**
 * Optional auth - Attach user if token exists, but don't require it
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, but we don't throw error for optional auth
    }
  }

  next();
});

module.exports = {
  protect,
  optionalAuth,
};
