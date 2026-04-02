import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, getMe } from '../features/auth/authSlice';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + encodeURIComponent('Google authentication failed'));
        return;
      }

      if (token) {
        // Store token in localStorage and Redux
        dispatch(setToken(token));
        // Fetch user data
        const result = await dispatch(getMe());
        if (getMe.fulfilled.match(result)) {
          navigate('/feed');
        } else {
          navigate('/login?error=' + encodeURIComponent('Failed to authenticate'));
        }
      } else {
        navigate('/login?error=' + encodeURIComponent('No token received'));
      }
    };

    handleAuth();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="oauth-callback">
      <div className="oauth-callback__spinner"></div>
      <p>Completing authentication...</p>
    </div>
  );
};

export default OAuthCallback;
