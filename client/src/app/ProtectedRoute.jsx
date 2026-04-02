import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageSpinner } from '../components/ui';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
