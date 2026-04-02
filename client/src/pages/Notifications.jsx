import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '../features/notifications/notificationsSlice';
import { Card, Avatar, Spinner, Button } from '../components/ui';
import './Notifications.css';

function Notifications() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, pagination, error } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      dispatch(fetchNotifications({ page: pagination.page + 1, limit: 20 }));
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id || notification._id));
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow': return '👤';
      case 'like': return '❤️';
      case 'comment': return '💬';
      default: return '🔔';
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'follow':
        return `/users/${notification.sender?.id || notification.sender?._id}`;
      case 'like':
      case 'comment':
        return notification.post ? `/posts/${notification.post.id || notification.post._id}` : '#';
      default:
        return '#';
    }
  };

  return (
    <div className="notifications-page">
      <Card className="notifications-page__card">
        <div className="notifications-page__header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {error && (
          <div className="notifications-page__error">
            <p>{error}</p>
          </div>
        )}

        {isLoading && notifications.length === 0 ? (
          <div className="notifications-page__loading">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-page__empty">
            <span className="notifications-page__empty-icon">🔔</span>
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later.</p>
          </div>
        ) : (
          <div className="notifications-page__list">
            {notifications.map((notification) => (
              <Link
                key={notification.id || notification._id}
                to={getNotificationLink(notification)}
                className={`notifications-page__item ${!notification.read ? 'notifications-page__item--unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="notifications-page__item-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <Avatar
                  name={notification.sender?.name}
                  src={notification.sender?.avatar}
                  size="md"
                />
                <div className="notifications-page__item-content">
                  <p className="notifications-page__item-message">
                    <strong>{notification.sender?.name}</strong>{' '}
                    {notification.type === 'follow' && 'started following you'}
                    {notification.type === 'like' && 'liked your post'}
                    {notification.type === 'comment' && 'commented on your post'}
                  </p>
                  {notification.post?.text && (
                    <p className="notifications-page__item-preview">
                      "{notification.post.text.substring(0, 50)}..."
                    </p>
                  )}
                  <span className="notifications-page__item-time">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                {!notification.read && (
                  <span className="notifications-page__item-dot"></span>
                )}
              </Link>
            ))}
          </div>
        )}

        {pagination.hasMore && !isLoading && (
          <div className="notifications-page__load-more">
            <Button variant="secondary" onClick={handleLoadMore}>
              Load More
            </Button>
          </div>
        )}

        {isLoading && notifications.length > 0 && (
          <div className="notifications-page__loading-more">
            <Spinner size="sm" />
          </div>
        )}
      </Card>
    </div>
  );
}

export default Notifications;
