const express = require('express');
const userController = require('../controllers/user.controller');
const { protect, optionalAuth } = require('../middlewares/auth');
const {
  validateUpdateProfile,
  validateSearchQuery,
  validatePagination,
} = require('../validators/user.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by name or skills
 * @access  Public
 */
router.get('/search', validateSearchQuery, userController.searchUsers);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', protect, validateUpdateProfile, userController.updateMyProfile);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete current user's account
 * @access  Private
 */
router.delete('/me', protect, userController.deleteMyAccount);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Public (with optional auth for isFollowing)
 */
router.get('/:id', optionalAuth, userController.getUserById);

/**
 * @route   POST /api/v1/users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:id/follow', protect, userController.followUser);

/**
 * @route   DELETE /api/v1/users/:id/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/:id/follow', protect, userController.unfollowUser);

/**
 * @route   GET /api/v1/users/:id/followers
 * @desc    Get user's followers
 * @access  Public (with optional auth for isFollowing)
 */
router.get('/:id/followers', optionalAuth, validatePagination, userController.getFollowers);

/**
 * @route   GET /api/v1/users/:id/following
 * @desc    Get users that a user is following
 * @access  Public (with optional auth for isFollowing)
 */
router.get('/:id/following', optionalAuth, validatePagination, userController.getFollowing);

module.exports = router;
