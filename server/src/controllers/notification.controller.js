const Notification = require('../models/notification.model');
const notificationService = require('../services/notification.service');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/responseHelpers');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const unreadOnly = req.query.unread === 'true';

  const query = { recipient: req.user.id };
  if (unreadOnly) {
    query.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('post', 'text')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    notificationService.getUnreadCount(req.user.id),
  ]);

  const pages = Math.ceil(total / limit);

  sendSuccess(
    res,
    200,
    'Notifications retrieved successfully',
    {
      notifications: notifications.map((n) => ({
        ...n,
        id: n._id,
        sender: n.sender ? { ...n.sender, id: n.sender._id } : null,
        post: n.post ? { ...n.post, id: n.post._id } : null,
      })),
      unreadCount,
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
 * @desc    Get unread notification count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);

  sendSuccess(res, 200, 'Unread count retrieved', { unreadCount: count });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  notification.read = true;
  await notification.save();

  sendSuccess(res, 200, 'Notification marked as read', { notification });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );

  sendSuccess(res, 200, 'All notifications marked as read');
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  await notification.deleteOne();

  sendSuccess(res, 200, 'Notification deleted');
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
