import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout';
import { Home, Login, Register, Feed, NotFound } from '../pages';
import Profile from '../pages/Profile';
import UserProfile from '../pages/UserProfile';
import Search from '../pages/Search';
import FollowList from '../pages/FollowList';
import Notifications from '../pages/Notifications';
import OAuthCallback from '../pages/OAuthCallback';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'oauth/callback',
        element: <OAuthCallback />,
      },
      {
        path: 'feed',
        element: (
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id',
        element: <UserProfile />,
      },
      {
        path: 'users/:id/followers',
        element: <FollowList type="followers" />,
      },
      {
        path: 'users/:id/following',
        element: <FollowList type="following" />,
      },
      {
        path: 'search',
        element: <Search />,
      },
      {
        path: 'posts/:postId',
        element: (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Post Detail Page (Coming soon)
          </div>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
