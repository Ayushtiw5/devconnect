const Notification = require('../models/notification.model');

/**
 * Create a notification
 * @param {Object} data - Notification data
 * @returns {Promise<Notification>}
 */
const createNotification = async ({ recipient, sender, type, post, comment, message }) => {
  // Don't notify yourself
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
    comment,
    message,
  });

  // Populate for response
  await notification.populate('sender', 'name avatar');
  if (post) {
    await notification.populate('post', 'text');
  }

  return notification;
};

/**
 * Create follow notification
 */
const notifyFollow = async (followerId, followedId, followerName) => {
  return createNotification({
    recipient: followedId,
    sender: followerId,
    type: 'follow',
    message: `${followerName} started following you`,
  });
};

/**
 * Create like notification
 */
const notifyLike = async (likerId, postAuthorId, postId, likerName) => {
  return createNotification({
    recipient: postAuthorId,
    sender: likerId,
    type: 'like',
    post: postId,
    message: `${likerName} liked your post`,
  });
};

/**
 * Create comment notification
 */
const notifyComment = async (commenterId, postAuthorId, postId, commentId, commenterName) => {
  return createNotification({
    recipient: postAuthorId,
    sender: commenterId,
    type: 'comment',
    post: postId,
    comment: commentId,
    message: `${commenterName} commented on your post`,
  });
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, read: false });
};

module.exports = {
  createNotification,
  notifyFollow,
  notifyLike,
  notifyComment,
  getUnreadCount,
};
