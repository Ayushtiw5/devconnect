const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/notification.model');
const { sendSuccess } = require('../utils/responseHelpers');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const notificationService = require('../services/notification.service');

// Fields to select for public profile (avoid over-fetching)
const PUBLIC_FIELDS = 'name email avatar bio skills socialLinks followers following createdAt';
const LIST_FIELDS = 'name email avatar bio skills';

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:id
 * @access  Public
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select(PUBLIC_FIELDS)
    .lean();

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current user is following this user
  let isFollowing = false;
  if (req.user) {
    isFollowing = req.user.following.some(
      (id) => id.toString() === user._id.toString()
    );
  }

  // Add computed fields
  const userProfile = {
    ...user,
    id: user._id,
    followerCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    isFollowing,
  };

  // Remove raw arrays from response
  delete userProfile.followers;
  delete userProfile.following;
  delete userProfile._id;

  sendSuccess(res, 200, 'User retrieved successfully', { user: userProfile });
});

/**
 * @desc    Update my profile
 * @route   PUT /api/v1/users/me
 * @access  Private
 */
const updateMyProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'bio', 'avatar', 'skills', 'socialLinks'];
  
  // Filter to only allowed fields
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields to update', 400));
  }

  // Handle skills - ensure unique and lowercase
  if (updates.skills) {
    updates.skills = [...new Set(updates.skills.map(s => s.toLowerCase().trim()))];
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select(PUBLIC_FIELDS);

  sendSuccess(res, 200, 'Profile updated successfully', {
    user: user.toPublicProfile(),
  });
});

/**
 * @desc    Search users by name or skills
 * @route   GET /api/v1/users/search
 * @access  Public
 */
const searchUsers = catchAsync(async (req, res, next) => {
  const { q, skills, page = 1, limit = 10, sort = '-createdAt' } = req.query;

  // Build query
  const query = { isActive: true };

  // Text search (name)
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { skills: { $regex: q, $options: 'i' } },
    ];
  }

  // Skills filter
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    query.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
  }

  // If no search criteria, return error
  if (!q && !skills) {
    return next(new AppError('Please provide search query (q) or skills', 400));
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Parse sort
  const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
  const sortOrder = sort.startsWith('-') ? -1 : 1;

  // Execute query with pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .select(LIST_FIELDS)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  // Format users
  const formattedUsers = users.map(user => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    skills: user.skills,
  }));

  sendSuccess(res, 200, 'Users retrieved successfully', { users: formattedUsers }, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + users.length < total,
    },
  });
});

/**
 * @desc    Follow a user
 * @route   POST /api/v1/users/:id/follow
 * @access  Private
 */
const followUser = catchAsync(async (req, res, next) => {
  const userToFollow = await User.findById(req.params.id);

  if (!userToFollow) {
    return next(new AppError('User not found', 404));
  }

  // Can't follow yourself
  if (userToFollow._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  // Check if already following
  if (req.user.following.includes(userToFollow._id)) {
    return next(new AppError('You are already following this user', 400));
  }

  // Add to following/followers using atomic operations
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { following: userToFollow._id },
    }),
    User.findByIdAndUpdate(userToFollow._id, {
      $addToSet: { followers: req.user._id },
    }),
  ]);

  // Send notification (async, don't wait)
  notificationService.notifyFollow(req.user._id, userToFollow._id, req.user.name).catch(() => {});

  sendSuccess(res, 200, `You are now following ${userToFollow.name}`, {
    following: {
      id: userToFollow._id,
      name: userToFollow.name,
    },
  });
});

/**
 * @desc    Unfollow a user
 * @route   DELETE /api/v1/users/:id/follow
 * @access  Private
 */
const unfollowUser = catchAsync(async (req, res, next) => {
  const userToUnfollow = await User.findById(req.params.id);

  if (!userToUnfollow) {
    return next(new AppError('User not found', 404));
  }

  // Can't unfollow yourself
  if (userToUnfollow._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot unfollow yourself', 400));
  }

  // Check if actually following
  if (!req.user.following.includes(userToUnfollow._id)) {
    return next(new AppError('You are not following this user', 400));
  }

  // Remove from following/followers using atomic operations
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id },
    }),
    User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id },
    }),
  ]);

  sendSuccess(res, 200, `You have unfollowed ${userToUnfollow.name}`);
});

/**
 * @desc    Get user's followers
 * @route   GET /api/v1/users/:id/followers
 * @access  Public (with optional auth for isFollowing)
 */
const getFollowers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.params.id).select('followers name');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const skip = (page - 1) * limit;
  const total = user.followers.length;

  // Get paginated followers
  const followerIds = user.followers.slice(skip, skip + parseInt(limit));

  const followers = await User.find({ _id: { $in: followerIds } })
    .select(LIST_FIELDS)
    .lean();

  // Get current user's following list for isFollowing check
  const currentUserFollowing = req.user?.following?.map(id => id.toString()) || [];

  const formattedFollowers = followers.map(f => ({
    id: f._id,
    name: f.name,
    email: f.email,
    avatar: f.avatar,
    bio: f.bio,
    skills: f.skills,
    isFollowing: currentUserFollowing.includes(f._id.toString()),
  }));

  sendSuccess(res, 200, `Followers of ${user.name}`, { users: formattedFollowers }, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + followers.length < total,
    },
  });
});

/**
 * @desc    Get users that a user is following
 * @route   GET /api/v1/users/:id/following
 * @access  Public (with optional auth for isFollowing)
 */
const getFollowing = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.params.id).select('following name');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const skip = (page - 1) * limit;
  const total = user.following.length;

  // Get paginated following
  const followingIds = user.following.slice(skip, skip + parseInt(limit));

  const following = await User.find({ _id: { $in: followingIds } })
    .select(LIST_FIELDS)
    .lean();

  // Get current user's following list for isFollowing check
  const currentUserFollowing = req.user?.following?.map(id => id.toString()) || [];

  const formattedFollowing = following.map(f => ({
    id: f._id,
    name: f.name,
    email: f.email,
    avatar: f.avatar,
    bio: f.bio,
    skills: f.skills,
    isFollowing: currentUserFollowing.includes(f._id.toString()),
  }));

  sendSuccess(res, 200, `Users followed by ${user.name}`, { users: formattedFollowing }, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + following.length < total,
    },
  });
});

/**
 * @desc    Delete my account
 * @route   DELETE /api/v1/users/me
 * @access  Private
 */
const deleteMyAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // For Google OAuth users (no password), allow deletion without password
  if (user.googleId && !user.password) {
    // Proceed with deletion for OAuth users
  } else {
    // For regular users, verify password
    if (!password) {
      return next(new AppError('Please provide your password to delete account', 400));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Incorrect password', 401));
    }
  }

  // Delete all user's posts
  await Post.deleteMany({ author: req.user._id });

  // Remove user from all followers' following lists
  await User.updateMany(
    { following: req.user._id },
    { $pull: { following: req.user._id } }
  );

  // Remove user from all following users' followers lists
  await User.updateMany(
    { followers: req.user._id },
    { $pull: { followers: req.user._id } }
  );

  // Delete all notifications for/from this user
  await Notification.deleteMany({
    $or: [{ recipient: req.user._id }, { sender: req.user._id }]
  });

  // Remove user's likes from all posts
  await Post.updateMany(
    { likes: req.user._id },
    { $pull: { likes: req.user._id } }
  );

  // Remove user's comments from all posts
  await Post.updateMany(
    { 'comments.author': req.user._id },
    { $pull: { comments: { author: req.user._id } } }
  );

  // Delete the user
  await User.findByIdAndDelete(req.user._id);

  sendSuccess(res, 200, 'Account deleted successfully');
});

module.exports = {
  getUserById,
  updateMyProfile,
  deleteMyAccount,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
