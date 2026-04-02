import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../src/features/auth/authSlice';
import postsReducer from '../src/features/posts/postsSlice';
import Feed from '../src/pages/Feed';

// Mock the CreatePost and PostCard components to simplify testing
vi.mock('../src/components/CreatePost', () => ({
  default: () => <div data-testid="create-post">CreatePost Component</div>,
}));

vi.mock('../src/components/PostCard', () => ({
  default: ({ post }) => <div data-testid="post-card">{post.text}</div>,
}));

// Create a test store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      posts: postsReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Test wrapper component
const renderWithProviders = (component, { preloadedState = {} } = {}) => {
  const store = createTestStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>{component}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('Feed Page', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const defaultAuthState = {
    auth: {
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders feed page with header', () => {
    renderWithProviders(<Feed />, {
      preloadedState: {
        ...defaultAuthState,
        posts: {
          posts: [],
          currentPost: null,
          isLoading: false,
          error: null,
          pagination: { page: 1, hasMore: false },
        },
      },
    });

    expect(screen.getByRole('heading', { name: /your feed/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('renders create post component', () => {
    renderWithProviders(<Feed />, {
      preloadedState: {
        ...defaultAuthState,
        posts: {
          posts: [],
          currentPost: null,
          isLoading: false,
          error: null,
          pagination: { page: 1, hasMore: false },
        },
      },
    });

    expect(screen.getByTestId('create-post')).toBeInTheDocument();
  });

  it('shows loading spinner when loading posts', () => {
    renderWithProviders(<Feed />, {
      preloadedState: {
        ...defaultAuthState,
        posts: {
          posts: [],
          currentPost: null,
          isLoading: true,
          error: null,
          pagination: { page: 1, hasMore: false },
        },
      },
    });

    // Check for spinner or loading indicator
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders posts when available', () => {
    const mockPosts = [
      { id: '1', text: 'First post', author: mockUser, createdAt: new Date().toISOString() },
      { id: '2', text: 'Second post', author: mockUser, createdAt: new Date().toISOString() },
    ];

    renderWithProviders(<Feed />, {
      preloadedState: {
        ...defaultAuthState,
        posts: {
          posts: mockPosts,
          currentPost: null,
          isLoading: false,
          error: null,
          pagination: { page: 1, hasMore: false },
        },
      },
    });

    const postCards = screen.getAllByTestId('post-card');
    expect(postCards).toHaveLength(2);
    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
  });

  it('shows end message when no more posts to load', () => {
    const mockPosts = [
      { id: '1', text: 'A post', author: mockUser, createdAt: new Date().toISOString() },
    ];

    renderWithProviders(<Feed />, {
      preloadedState: {
        ...defaultAuthState,
        posts: {
          posts: mockPosts,
          currentPost: null,
          isLoading: false,
          error: null,
          pagination: { page: 1, hasMore: false },
        },
      },
    });

    expect(screen.getByText(/you've reached the end/i)).toBeInTheDocument();
  });
});
