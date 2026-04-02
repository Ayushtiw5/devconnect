import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../features/notifications/notificationsSlice';
import { Avatar, Spinner } from './ui';
import './NotificationBell.css';

function NotificationBell() {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, pagination } = useSelector(
    (state) => state.notifications
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count periodically
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadCount());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [dispatch, isAuthenticated]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }
  }, [isOpen, dispatch, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id || notification._id));
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell__trigger" onClick={handleToggle}>
        <i className="fa-regular fa-bell notification-bell__icon"></i>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="notification-bell__mark-all"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {isLoading && notifications.length === 0 ? (
              <div className="notification-bell__loading">
                <Spinner size="sm" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-bell__empty">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id || notification._id}
                  to={getNotificationLink(notification)}
                  className={`notification-bell__item ${!notification.read ? 'notification-bell__item--unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-bell__item-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <Avatar 
                    name={notification.sender?.name} 
                    src={notification.sender?.avatar}
                    size="sm"
                  />
                  <div className="notification-bell__item-content">
                    <p className="notification-bell__item-message">
                      {notification.message}
                    </p>
                    <span className="notification-bell__item-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {pagination.hasMore && (
            <Link 
              to="/notifications" 
              className="notification-bell__view-all"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
