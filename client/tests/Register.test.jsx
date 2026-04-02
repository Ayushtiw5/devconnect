import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../src/features/auth/authSlice';
import Register from '../src/pages/Register';

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

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    renderWithProviders(<Register />);

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('has all required input fields with correct types', () => {
    renderWithProviders(<Register />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('disables submit button when loading', () => {
    renderWithProviders(<Register />, {
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

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('shows join community message', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText(/join the developer community/i)).toBeInTheDocument();
  });
});
