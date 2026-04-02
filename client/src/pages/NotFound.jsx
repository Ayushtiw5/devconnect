import { Button } from '../components/ui';
import './NotFound.css';

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page Not Found</h2>
        <p className="not-found__text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button to="/">Back to Home</Button>
      </div>
    </div>
  );
}

export default NotFound;
