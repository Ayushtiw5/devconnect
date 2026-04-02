const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError('Email already registered', 409));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate token
  const token = generateToken({ id: user._id });

  // Send response
  sendSuccess(res, 201, 'Registration successful', {
    user: user.toPublicProfile(),
    token,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Contact support.', 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = generateToken({ id: user._id });

  // Send response
  sendSuccess(res, 200, 'Login successful', {
    user: user.toPublicProfile(),
    token,
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res, next) => {
  // User is already attached by protect middleware
  const user = await User.findById(req.user._id);

  sendSuccess(res, 200, 'User retrieved successfully', {
    user: user.toPublicProfile(),
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 *
 * NOTE: JWT is stateless. True logout requires one of:
 * 1. Client-side token deletion (current implementation)
 * 2. Token blacklist in Redis (recommended for production)
 * 3. Short-lived access tokens + refresh tokens
 *
 * This endpoint exists for:
 * - API consistency
 * - Future token blacklist implementation
 * - Client confirmation of logout intent
 */
const logout = catchAsync(async (req, res, next) => {
  // In a stateless JWT setup, we simply confirm logout
  // Client is responsible for removing the token

  // Future: Add token to Redis blacklist
  // await redis.set(`bl_${token}`, 'true', 'EX', tokenExpiry);

  sendSuccess(res, 200, 'Logout successful. Please remove token from client.');
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken({ id: user._id });

  sendSuccess(res, 200, 'Password updated successfully', { token });
});

/**
 * @desc    Google OAuth callback
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
 */
const googleCallback = catchAsync(async (req, res, next) => {
  // User is attached by passport
  const user = req.user;

  // Generate JWT token
  const token = generateToken({ id: user._id });

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Redirect to frontend with token
  const config = require('../config');
  res.redirect(`${config.clientUrl}/oauth/callback?token=${token}`);
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  googleCallback,
};
