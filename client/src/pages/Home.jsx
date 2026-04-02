import { useSelector } from 'react-redux';
import { PenSquare, Users, MessageCircle } from 'lucide-react';
import { Button, Card } from '../components/ui';
import './Home.css';

function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="home">
      <div className="home__hero">
        <h1 className="home__title">
          Connect with <span className="home__highlight">Developers</span>
        </h1>
        <p className="home__subtitle">
          Join a community of developers. Share your projects, learn from others,
          and build your network.
        </p>
        <div className="home__cta">
          {isAuthenticated ? (
            <Button to="/feed" size="lg">Go to Feed</Button>
          ) : (
            <Button to="/register" size="lg">Get Started</Button>
          )}
        </div>
      </div>

      <div className="home__features">
        <Card className="home__feature">
          <PenSquare className="home__feature-icon" size={48} color="#000000" />
          <h3 className="home__feature-title">Share Posts</h3>
          <p className="home__feature-desc">
            Share your thoughts, projects, and learnings with the community.
          </p>
        </Card>
        <Card className="home__feature">
          <Users className="home__feature-icon" size={48} color="#000000" />
          <h3 className="home__feature-title">Follow Developers</h3>
          <p className="home__feature-desc">
            Connect with like-minded developers and grow your network.
          </p>
        </Card>
        <Card className="home__feature">
          <MessageCircle className="home__feature-icon" size={48} color="#000000" />
          <h3 className="home__feature-title">Engage</h3>
          <p className="home__feature-desc">
            Like, comment, and discuss ideas with fellow developers.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default Home;
