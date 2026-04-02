import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Async thunks
export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user'
      );
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async ({ q, skills, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (skills) params.append('skills', skills);
      params.append('page', page);
      params.append('limit', limit);
      
      const response = await api.get(`/users/search?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to search users'
      );
    }
  }
);

export const followUser = createAsyncThunk(
  'users/followUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      return { userId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to follow user'
      );
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/${userId}/follow`);
      return { userId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to unfollow user'
      );
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'users/fetchFollowers',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
      return { userId, type: 'followers', ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch followers'
      );
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'users/fetchFollowing',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
      return { userId, type: 'following', ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch following'
      );
    }
  }
);

const initialState = {
  currentUser: null,
  searchResults: [],
  followers: [],
  following: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasMore: false,
  },
  isLoading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.data.users;
        state.pagination = action.payload.meta.pagination;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Follow User
      .addCase(followUser.fulfilled, (state, action) => {
        const userId = action.payload.userId;
        // Update currentUser
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser.followerCount = action.payload.followerCount;
          state.currentUser.isFollowing = true;
        }
        // Update in followers list
        const followerIndex = state.followers.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (followerIndex !== -1) {
          state.followers[followerIndex].isFollowing = true;
        }
        // Update in following list
        const followingIndex = state.following.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (followingIndex !== -1) {
          state.following[followingIndex].isFollowing = true;
        }
        // Update in search results
        const searchIndex = state.searchResults.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (searchIndex !== -1) {
          state.searchResults[searchIndex].isFollowing = true;
        }
      })
      // Unfollow User
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const userId = action.payload.userId;
        // Update currentUser
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser.followerCount = action.payload.followerCount;
          state.currentUser.isFollowing = false;
        }
        // Update in followers list
        const followerIndex = state.followers.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (followerIndex !== -1) {
          state.followers[followerIndex].isFollowing = false;
        }
        // Update in following list
        const followingIndex = state.following.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (followingIndex !== -1) {
          state.following[followingIndex].isFollowing = false;
        }
        // Update in search results
        const searchIndex = state.searchResults.findIndex(
          (u) => (u.id || u._id) === userId
        );
        if (searchIndex !== -1) {
          state.searchResults[searchIndex].isFollowing = false;
        }
      })
      // Fetch Followers
      .addCase(fetchFollowers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.followers = action.payload.data.users;
        state.pagination = action.payload.meta.pagination;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Following
      .addCase(fetchFollowing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.isLoading = false;
        state.following = action.payload.data.users;
        state.pagination = action.payload.meta.pagination;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentUser, clearSearchResults, clearError } = usersSlice.actions;
export default usersSlice.reducer;
