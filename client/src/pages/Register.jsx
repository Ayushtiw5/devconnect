import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register, clearError } from '../features/auth/authSlice';
import { Button, Input, Card } from '../components/ui';
import toast from 'react-hot-toast';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/feed';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Show API errors
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

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const { confirmPassword, ...registerData } = formData;
    const result = await dispatch(register(registerData));
    
    if (register.fulfilled.match(result)) {
      toast.success('Welcome to DevConnect!');
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
          <h1 className="auth__title">Create Account</h1>
          <p className="auth__subtitle">Join the developer community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth__form">
          <Input
            type="text"
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={validationErrors.name}
            disabled={isLoading}
          />

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

          <Input
            type="password"
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={validationErrors.confirmPassword}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Create Account
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
            Already have an account?{' '}
            <Link to="/login" className="auth__link">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Register;
