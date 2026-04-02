import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { clearNotifications } from '../../features/notifications/notificationsSlice';
import { Avatar, Button } from '../ui';
import NotificationBell from '../NotificationBell';
import devLogo from '../../assets/dev.png';
import './Navbar.css';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearNotifications());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__brand">
          <img src={devLogo} alt="DevConnect" className="navbar__logo-img" />
        </Link>

        {isAuthenticated && (
          <div className="navbar__search">
            <input
              type="text"
              placeholder="Search developers..."
              className="navbar__search-input"
              onFocus={() => navigate('/search')}
            />
          </div>
        )}

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to="/feed" className="navbar__link">
                <i className="fa-regular fa-house"></i>
              </Link>
              <NotificationBell />
              <Link to="/profile" className="navbar__link">
                <Avatar src={user?.avatar} name={user?.name} size="sm" />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button to="/register" variant="primary" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
