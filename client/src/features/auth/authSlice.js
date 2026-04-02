import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import config from '../../lib/config';

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data.data;
      localStorage.setItem(config.tokenKey, token);
      localStorage.setItem(config.userKey, JSON.stringify(user));
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      const errors = error.response?.data?.errors || [];
      return rejectWithValue({ message, errors });
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data.data;
      localStorage.setItem(config.tokenKey, token);
      localStorage.setItem(config.userKey, JSON.stringify(user));
      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data.user;
      localStorage.setItem(config.userKey, JSON.stringify(user));
      return user;
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem(config.tokenKey);
      localStorage.removeItem(config.userKey);
      return rejectWithValue(
        error.response?.data?.message || 'Session expired'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/me', profileData);
      const user = response.data.data.user;
      localStorage.setItem(config.userKey, JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

// Initialize auth - check if stored token is valid
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch, getState }) => {
    const { auth } = getState();
    
    // If we have a token, verify it's still valid
    if (auth.token) {
      try {
        const response = await api.get('/auth/me');
        const user = response.data.data.user;
        localStorage.setItem(config.userKey, JSON.stringify(user));
        return { user, token: auth.token };
      } catch (error) {
        // Token is invalid - clear it
        localStorage.removeItem(config.tokenKey);
        localStorage.removeItem(config.userKey);
        throw error;
      }
    }
    
    return null;
  }
);

// Get initial state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem(config.tokenKey);
  const userStr = localStorage.getItem(config.userKey);
  let user = null;
  
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading: false,
    isInitialized: false, // Track if we've verified the token
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    logout: (state) => {
      localStorage.removeItem(config.tokenKey);
      localStorage.removeItem(config.userKey);
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem(config.tokenKey, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : action.payload?.message || 'Registration failed';
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setInitialized, setToken } = authSlice.actions;
export default authSlice.reducer;
