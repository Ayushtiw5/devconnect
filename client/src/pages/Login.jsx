import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { login, clearError } from '../features/auth/authSlice';
import { Button, Input, Card } from '../components/ui';
import toast from 'react-hot-toast';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Show OAuth error if present
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  // Redirect if already authenticated (preserve intended destination)
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/feed';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Show API errors via toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const result = await dispatch(login(formData));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = "https://devconnect-api-rywv.onrender.com/api/v1/auth/google";
  };

  return (
    <div className="auth">
      <Card className="auth__card">
        <div className="auth__header">
          <h1 className="auth__title">Welcome Back</h1>
          <p className="auth__subtitle">Sign in to continue to DevConnect</p>
        </div>

        <form onSubmit={handleSubmit} className="auth__form">
          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={validationErrors.email}
            disabled={isLoading}
          />

          <Input
            type="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={validationErrors.password}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="auth__divider">
          <span>or</span>
        </div>

        <button 
          type="button" 
          className="auth__google-btn"
          onClick={handleGoogleLogin}
        >
          <i className="fa-brands fa-google"></i>
          Continue with Google
        </button>

        <div className="auth__footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth__link">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="auth__demo">
          <p>Demo: john@example.com / password123</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
