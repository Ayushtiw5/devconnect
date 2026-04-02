import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, setInitialized } from './authSlice';
import { PageSpinner } from '../../components/ui';

/**
 * AuthProvider - Initializes authentication on app load
 * Verifies stored token is still valid
 */
function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { isInitialized, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      if (token) {
        // Verify the token is still valid
        dispatch(initializeAuth());
      } else {
        // No token, mark as initialized
        dispatch(setInitialized());
      }
    }
  }, [dispatch, isInitialized, token]);

  // Show loading spinner while initializing
  if (!isInitialized) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a2e'
      }}>
        <PageSpinner />
      </div>
    );
  }

  return children;
}

export default AuthProvider;
