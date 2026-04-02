import axios from 'axios';
import config from './config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config: reqConfig } = error;

    // Handle specific error codes
    if (response) {
      switch (response.status) {
        case 401:
          // Skip auto-logout for password verification endpoints (like delete account)
          const skipLogoutEndpoints = ['/users/me'];
          const isPasswordVerification = skipLogoutEndpoints.some(
            (endpoint) => reqConfig.url?.includes(endpoint) && reqConfig.method === 'delete'
          );
          
          if (isPasswordVerification) {
            // Just reject the error, don't logout
            break;
          }
          
          // Token expired or invalid - clear storage
          // Only redirect if not already on auth pages
          if (
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/register'
          ) {
            localStorage.removeItem(config.tokenKey);
            localStorage.removeItem(config.userKey);
            // Dispatch logout action via store
            if (window.store) {
              window.store.dispatch({ type: 'auth/logout' });
            }
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      error.message = 'Request timed out. Please try again.';
    } else if (!error.response) {
      // Network error
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
