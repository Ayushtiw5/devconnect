const Post = require('../models/Post');
const Comment = require('../models/Comment');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseHelpers');
const mongoose = require('mongoose');
const notificationService = require('../services/notification.service');

/**
 * @desc    Like a post (toggle-like: adds like if not already liked)
 * @route   POST /api/v1/posts/:id/like
 * @access  Private
 */
exports.likePost = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  // Use $addToSet to prevent duplicates atomically
  const post = await Post.findByIdAndUpdate(
    postId,
    { $addToSet: { likes: userId } },
    { new: true }
  ).populate('author', 'name email avatar');

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Send notification to post author (async, don't wait)
  notificationService.notifyLike(userId, post.author._id, postId, req.user.name).catch(() => {});

  sendSuccess(res, 200, 'Post liked successfully', {
    post: post.toFeedPost(userId),
  });
});

/**
 * @desc    Unlike a post
 * @route   DELETE /api/v1/posts/:id/like
 * @access  Private
 */
exports.unlikePost = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  // Use $pull to remove the like atomically
  const post = await Post.findByIdAndUpdate(
    postId,
    { $pull: { likes: userId } },
    { new: true }
  ).populate('author', 'name email avatar');

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  sendSuccess(res, 200, 'Post unliked successfully', {
    post: post.toFeedPost(userId),
  });
});

/**
 * @desc    Toggle like (like if not liked, unlike if liked)
 * @route   POST /api/v1/posts/:id/like/toggle
 * @access  Private
 */
exports.toggleLike = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  // First check if post exists and if user has liked
  const post = await Post.findById(postId).populate('author', 'name email avatar');

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const hasLiked = post.isLikedBy(userId);
  let action;

  if (hasLiked) {
    // Unlike
    await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
    action = 'unliked';
  } else {
    // Like
    await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
    action = 'liked';
    
    // Send notification on like (async, don't wait)
    notificationService.notifyLike(userId, post.author._id, postId, req.user.name).catch(() => {});
  }

  // Fetch updated post with author populated
  const updatedPost = await Post.findById(postId).populate(
    'author',
    'name email avatar'
  );

  sendSuccess(res, 200, `Post ${action} successfully`, {
    post: updatedPost.toFeedPost(userId),
    action,
  });
});

/**
 * @desc    Get users who liked a post
 * @route   GET /api/v1/posts/:id/likes
 * @access  Public
 */
exports.getPostLikes = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  const post = await Post.findById(postId)
    .select('likes')
    .populate({
      path: 'likes',
      select: 'name email avatar',
      options: {
        skip,
        limit,
      },
    });

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Get total count
  const totalPost = await Post.findById(postId).select('likes');
  const total = totalPost.likes.length;
  const pages = Math.ceil(total / limit);

  sendSuccess(
    res,
    200,
    'Likes retrieved successfully',
    {
      users: post.likes,
    },
    {
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages,
      },
    }
  );
});

/**
 * @desc    Add comment to a post
 * @route   POST /api/v1/posts/:id/comments
 * @access  Private
 */
exports.addComment = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  // Check post exists
  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Create comment
  const comment = await Comment.create({
    text,
    author: userId,
    post: postId,
  });

  // Update commentsCount atomically
  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

  // Populate author details
  await comment.populate('author', 'name email avatar');

  // Send notification to post author (async, don't wait)
  notificationService.notifyComment(
    userId,
    post.author,
    postId,
    comment._id,
    req.user.name
  ).catch(() => {});

  sendSuccess(res, 201, 'Comment added successfully', {
    comment: comment.toPublicComment(),
  });
});

/**
 * @desc    Get comments for a post
 * @route   GET /api/v1/posts/:id/comments
 * @access  Public
 */
exports.getComments = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'oldest' ? 'createdAt' : '-createdAt';

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  // Check post exists
  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    return next(new AppError('Post not found', 404));
  }

  // Get comments with pagination
  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .populate('author', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ post: postId }),
  ]);

  const pages = Math.ceil(total / limit);

  // Format comments
  const formattedComments = comments.map((c) => ({
    id: c._id,
    text: c.text,
    author: c.author,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  sendSuccess(
    res,
    200,
    'Comments retrieved successfully',
    {
      comments: formattedComments,
    },
    {
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages,
      },
    }
  );
});

/**
 * @desc    Delete a comment (owner or admin only)
 * @route   DELETE /api/v1/posts/:postId/comments/:commentId
 * @access  Private
 */
exports.deleteComment = catchAsync(async (req, res, next) => {
  const { id: postId, commentId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new AppError('Invalid comment ID', 400));
  }

  // Find the comment
  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  // Check that comment belongs to the post
  if (comment.post.toString() !== postId) {
    return next(new AppError('Comment does not belong to this post', 400));
  }

  // Check ownership (owner or admin can delete)
  const isOwner = comment.author.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You can only delete your own comments', 403));
  }

  // Delete comment
  await Comment.findByIdAndDelete(commentId);

  // Decrement commentsCount atomically (ensure it doesn't go below 0)
  await Post.findByIdAndUpdate(
    postId,
    { $inc: { commentsCount: -1 } },
    { new: true }
  ).then(async (post) => {
    // Safety: if commentsCount somehow went negative, fix it
    if (post && post.commentsCount < 0) {
      await Post.findByIdAndUpdate(postId, { commentsCount: 0 });
    }
  });

  sendSuccess(res, 200, 'Comment deleted successfully');
});

/**
 * @desc    Sync commentsCount for a post (admin utility)
 * @route   POST /api/v1/posts/:id/sync-comments
 * @access  Private (Admin only)
 */
exports.syncCommentsCount = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return next(new AppError('Invalid post ID', 400));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Count actual comments
  const actualCount = await Comment.countDocuments({ post: postId });

  // Update if different
  if (post.commentsCount !== actualCount) {
    post.commentsCount = actualCount;
    await post.save();
  }

  sendSuccess(res, 200, 'Comments count synced', {
    postId,
    commentsCount: actualCount,
  });
});
