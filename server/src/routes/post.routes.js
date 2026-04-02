const express = require('express');
const postController = require('../controllers/post.controller');
const engagementController = require('../controllers/engagement.controller');
const { protect, optionalAuth } = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { uploadPostImage } = require('../middlewares/upload');
const {
  validateCreatePost,
  validateUpdatePost,
  validateGetPostsQuery,
} = require('../validators/post.validator');
const {
  validateAddComment,
  validateGetCommentsQuery,
  validateGetLikesQuery,
} = require('../validators/engagement.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/posts
 * @desc    Get all posts (feed) with pagination
 * @access  Public (optionalAuth for isLiked)
 */
router.get('/', optionalAuth, validateGetPostsQuery, postController.getFeedPosts);

/**
 * @route   GET /api/v1/posts/me
 * @desc    Get current user's posts
 * @access  Private
 */
router.get('/me', protect, postController.getMyPosts);

/**
 * @route   POST /api/v1/posts
 * @desc    Create a new post (with optional image)
 * @access  Private
 */
router.post('/', protect, uploadPostImage, validateCreatePost, postController.createPost);

/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get single post by ID
 * @access  Public (optionalAuth for isLiked)
 */
router.get('/:id', optionalAuth, postController.getPostById);

/**
 * @route   PUT /api/v1/posts/:id
 * @desc    Update post (owner only)
 * @access  Private
 */
router.put('/:id', protect, validateUpdatePost, postController.updatePost);

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    Delete post (owner or admin)
 * @access  Private
 */
router.delete('/:id', protect, postController.deletePost);

// ============ ENGAGEMENT ROUTES ============

/**
 * @route   POST /api/v1/posts/:id/like
 * @desc    Like a post (idempotent - won't duplicate)
 * @access  Private
 */
router.post('/:id/like', protect, engagementController.likePost);

/**
 * @route   DELETE /api/v1/posts/:id/like
 * @desc    Unlike a post
 * @access  Private
 */
router.delete('/:id/like', protect, engagementController.unlikePost);

/**
 * @route   POST /api/v1/posts/:id/like/toggle
 * @desc    Toggle like status
 * @access  Private
 */
router.post('/:id/like/toggle', protect, engagementController.toggleLike);

/**
 * @route   GET /api/v1/posts/:id/likes
 * @desc    Get users who liked a post
 * @access  Public
 */
router.get('/:id/likes', validateGetLikesQuery, engagementController.getPostLikes);

/**
 * @route   POST /api/v1/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:id/comments', protect, validateAddComment, engagementController.addComment);

/**
 * @route   GET /api/v1/posts/:id/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/:id/comments', validateGetCommentsQuery, engagementController.getComments);

/**
 * @route   DELETE /api/v1/posts/:id/comments/:commentId
 * @desc    Delete a comment (owner or admin)
 * @access  Private
 */
router.delete('/:id/comments/:commentId', protect, engagementController.deleteComment);

/**
 * @route   POST /api/v1/posts/:id/sync-comments
 * @desc    Sync comments count (admin utility)
 * @access  Private (Admin only)
 */
router.post('/:id/sync-comments', protect, authorize('admin'), engagementController.syncCommentsCount);

module.exports = router;
