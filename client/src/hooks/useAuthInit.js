import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from '../features/auth/authSlice';

/**
 * Hook to initialize auth state on app load
 * Fetches current user if token exists
 */
function useAuthInit() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but no confirmed auth, verify with server
    if (token && !isAuthenticated) {
      dispatch(getMe());
    }
  }, [dispatch, token, isAuthenticated]);
}

export default useAuthInit;
