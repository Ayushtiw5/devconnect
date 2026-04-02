import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.unreadCount;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch unread count'
      );
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark as read'
      );
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark all as read'
      );
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false,
  },
  isLoading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = initialState.pagination;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const { notifications, unreadCount } = action.payload.data;
        const { pagination } = action.payload.meta;
        
        // Replace on first page, append on subsequent
        if (pagination.page === 1) {
          state.notifications = notifications;
        } else {
          state.notifications = [...state.notifications, ...notifications];
        }
        state.unreadCount = unreadCount;
        state.pagination = pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          (n) => (n.id || n._id) === action.payload
        );
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { clearNotifications, clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer;
