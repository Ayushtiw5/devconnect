const Post = require('../models/Post');
const { sendSuccess } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Fields to populate for author
const AUTHOR_FIELDS = 'name email avatar';

/**
 * @desc    Create a new post
 * @route   POST /api/v1/posts
 * @access  Private
 */
const createPost = catchAsync(async (req, res, next) => {
  const { text } = req.body;
  
  // Get image paths if uploaded (multiple images)
  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  // Validate: at least text or image required
  if (!text?.trim() && images.length === 0) {
    return next(new AppError('Post must have either text or at least one image', 400));
  }

  const post = await Post.create({
    text: text || '',
    images,
    author: req.user._id,
  });

  // Populate author for response
  await post.populate('author', AUTHOR_FIELDS);

  sendSuccess(res, 201, 'Post created successfully', {
    post: post.toFeedPost(req.user._id),
  });
});

/**
 * @desc    Get feed posts (all posts, paginated)
 * @route   GET /api/v1/posts
 * @access  Public
 */
const getFeedPosts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, sort = '-createdAt', author } = req.query;

  // Build query
  const query = {};
  if (author) {
    query.author = author;
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  // Parse sort
  let sortOption = {};
  if (sort === '-createdAt' || sort === 'createdAt') {
    sortOption.createdAt = sort.startsWith('-') ? -1 : 1;
  } else if (sort === '-likeCount' || sort === 'likeCount') {
    // For likeCount sorting, we need aggregation
    // For simplicity, fall back to createdAt
    sortOption.createdAt = -1;
  }

  // Execute query with pagination
  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate('author', AUTHOR_FIELDS)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Post.countDocuments(query),
  ]);

  // Get current user ID for isLiked check
  const currentUserId = req.user?._id;

  // Format posts
  const formattedPosts = posts.map((post) => ({
    id: post._id,
    text: post.text,
    images: post.images || [],
    author: {
      id: post.author._id,
      name: post.author.name,
      email: post.author.email,
      avatar: post.author.avatar,
    },
    likeCount: post.likes?.length || 0,
    commentsCount: post.commentsCount || 0,
    isLiked: currentUserId
      ? post.likes?.some((id) => id.toString() === currentUserId.toString())
      : false,
    isEdited: post.isEdited || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));

  sendSuccess(
    res,
    200,
    'Posts retrieved successfully',
    { posts: formattedPosts },
    {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
    }
  );
});

/**
 * @desc    Get single post by ID
 * @route   GET /api/v1/posts/:id
 * @access  Public
 */
const getPostById = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('author', AUTHOR_FIELDS)
    .lean();

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const currentUserId = req.user?._id;

  const formattedPost = {
    id: post._id,
    text: post.text,
    images: post.images || [],
    author: {
      id: post.author._id,
      name: post.author.name,
      email: post.author.email,
      avatar: post.author.avatar,
    },
    likeCount: post.likes?.length || 0,
    commentsCount: post.commentsCount || 0,
    isLiked: currentUserId
      ? post.likes?.some((id) => id.toString() === currentUserId.toString())
      : false,
    isEdited: post.isEdited || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };

  sendSuccess(res, 200, 'Post retrieved successfully', { post: formattedPost });
});

/**
 * @desc    Update own post
 * @route   PUT /api/v1/posts/:id
 * @access  Private (owner only)
 */
const updatePost = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check ownership
  if (post.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own posts', 403));
  }

  // Update post
  post.text = text;
  post.isEdited = true;
  await post.save();

  // Populate author for response
  await post.populate('author', AUTHOR_FIELDS);

  sendSuccess(res, 200, 'Post updated successfully', {
    post: post.toFeedPost(req.user._id),
  });
});

/**
 * @desc    Delete own post (or admin)
 * @route   DELETE /api/v1/posts/:id
 * @access  Private (owner or admin)
 */
const deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Check ownership or admin
  const isOwner = post.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You can only delete your own posts', 403));
  }

  await Post.findByIdAndDelete(req.params.id);

  sendSuccess(res, 200, 'Post deleted successfully');
});

/**
 * @desc    Get posts by current user
 * @route   GET /api/v1/posts/me
 * @access  Private
 */
const getMyPosts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ author: req.user._id })
      .populate('author', AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Post.countDocuments({ author: req.user._id }),
  ]);

  const formattedPosts = posts.map((post) => ({
    id: post._id,
    text: post.text,
    images: post.images || [],
    author: {
      id: post.author._id,
      name: post.author.name,
      email: post.author.email,
      avatar: post.author.avatar,
    },
    likeCount: post.likes?.length || 0,
    commentsCount: post.commentsCount || 0,
    isLiked: post.likes?.some((id) => id.toString() === req.user._id.toString()),
    isEdited: post.isEdited || false,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));

  sendSuccess(
    res,
    200,
    'Your posts retrieved successfully',
    { posts: formattedPosts },
    {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total,
      },
    }
  );
});

module.exports = {
  createPost,
  getFeedPosts,
  getPostById,
  updatePost,
  deletePost,
  getMyPosts,
};
