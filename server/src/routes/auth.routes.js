const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Update password
 * @access  Private
 */
router.put('/password', protect, authController.updatePassword);

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
// TEMP: Comment out the real Passport callback route
// router.get('/google/callback',
//   (req, res, next) => { console.log('Google callback hit'); next(); },
//   passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
//   authController.googleCallback
// );

// Move the test route to /google/callback
router.get('/google/callback', (req, res) => {
  res.send('Google callback test route is working!');
});

router.get('/test', (req, res) => {
  
  res.send('Auth test route is working!');
});

router.get('/google/callback/test', (req, res) => {
  res.send('Google callback test route is working!');
});

module.exports = router;
