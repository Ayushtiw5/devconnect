import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10, sort = '-createdAt' } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts?page=${page}&limit=${limit}&sort=${sort}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch posts'
      );
    }
  }
);

export const fetchMyPosts = createAsyncThunk(
  'posts/fetchMyPosts',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/me?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch posts'
      );
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      return response.data.data.post;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch post'
      );
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const isFormData = postData instanceof FormData;
      const config = isFormData
        ? { headers: { 'Content-Type': undefined } }
        : {};
        
      const response = await api.post('/posts', postData, config);
      return response.data.data.post;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create post'
      );
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/posts/${postId}`, data);
      return response.data.data.post;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update post'
      );
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}`);
      return postId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete post'
      );
    }
  }
);

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/posts/${postId}/like/toggle`);
      return response.data.data.post;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle like'
      );
    }
  }
);

export const fetchComments = createAsyncThunk(
  'posts/fetchComments',
  async ({ postId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch comments'
      );
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { text });
      return { postId, comment: response.data.data.comment };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add comment'
      );
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
      return { postId, commentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete comment'
      );
    }
  }
);

const initialState = {
  posts: [],
  currentPost: null,
  comments: {},
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

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.pagination = initialState.pagination;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts } = action.payload.data;
        const { pagination } = action.payload.meta;
        
        // Append if loading more, replace if first page
        if (pagination.page === 1) {
          state.posts = posts;
        } else {
          state.posts = [...state.posts, ...posts];
        }
        state.pagination = pagination;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch My Posts
      .addCase(fetchMyPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.data.posts;
        state.pagination = action.payload.meta.pagination;
      })
      .addCase(fetchMyPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Post By ID
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
      })
      // Toggle Like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => p.id === updatedPost.id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
        if (state.currentPost?.id === updatedPost.id) {
          state.currentPost = updatedPost;
        }
      })
      // Fetch Comments
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { postId, data, meta } = action.payload;
        state.comments[postId] = {
          items: data.comments,
          pagination: meta.pagination,
        };
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        if (state.comments[postId]) {
          state.comments[postId].items.unshift(comment);
        }
        // Update commentsCount in posts
        const postIndex = state.posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].commentsCount += 1;
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.commentsCount += 1;
        }
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        if (state.comments[postId]) {
          state.comments[postId].items = state.comments[postId].items.filter(
            (c) => c.id !== commentId
          );
        }
        // Update commentsCount in posts
        const postIndex = state.posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1 && state.posts[postIndex].commentsCount > 0) {
          state.posts[postIndex].commentsCount -= 1;
        }
        if (state.currentPost?.id === postId && state.currentPost.commentsCount > 0) {
          state.currentPost.commentsCount -= 1;
        }
      });
  },
});

export const { clearPosts, clearCurrentPost, clearError } = postsSlice.actions;
export default postsSlice.reducer;
