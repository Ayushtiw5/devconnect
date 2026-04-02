import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../src/features/auth/authSlice';
import Login from '../src/pages/Login';

// Create a test store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });
};

// Test wrapper component
const renderWithProviders = (component, { preloadedState = {}, route = '/' } = {}) => {
  const store = createTestStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{component}</MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
  });

  it('has email and password inputs', () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows loading state when isLoading is true', () => {
    renderWithProviders(<Login />, {
      preloadedState: {
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        },
      },
    });

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('shows demo credentials hint', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText(/demo:/i)).toBeInTheDocument();
  });
});
