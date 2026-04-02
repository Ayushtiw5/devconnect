const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth');

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', protect, notificationController.getNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', protect, notificationController.getUnreadCount);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, notificationController.markAllAsRead);

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', protect, notificationController.markAsRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router;
