import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import postsReducer from '../features/posts/postsSlice';
import usersReducer from '../features/users/usersSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    users: usersReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
});

// Expose store globally for interceptor access
window.store = store;

export default store;
