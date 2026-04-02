import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserById, clearCurrentUser } from '../features/users/usersSlice';
import { Card, Avatar, Spinner } from '../components/ui';
import FollowButton from '../components/FollowButton';
import './UserProfile.css';

function UserProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentUser, isLoading, error } = useSelector((state) => state.users);
  const { user: authUser } = useSelector((state) => state.auth);

  const isOwnProfile = authUser?.id === id;

  useEffect(() => {
    dispatch(fetchUserById(id));

    return () => {
      dispatch(clearCurrentUser());
    };
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className="user-profile__loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile__error">
        <Card>
          <p>{error}</p>
          <Link to="/search">Back to search</Link>
        </Card>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="user-profile">
      <Card className="user-profile__card">
        <div className="user-profile__header">
          <Avatar name={currentUser.name} src={currentUser.avatar} size="2xl" />
          <div className="user-profile__info">
            <h1 className="user-profile__name">{currentUser.name}</h1>
            <p className="user-profile__role">{currentUser.role}</p>
          </div>
          <div className="user-profile__actions">
            {!isOwnProfile && authUser && (
              <FollowButton 
                userId={currentUser.id || currentUser._id} 
                isFollowing={currentUser.isFollowing}
              />
            )}
            {isOwnProfile && (
              <Link to="/profile" className="user-profile__edit-link">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        <div className="user-profile__stats">
          <Link to={`/users/${id}/followers`} className="user-profile__stat">
            <span className="user-profile__stat-value">{currentUser.followerCount || 0}</span>
            <span className="user-profile__stat-label">Followers</span>
          </Link>
          <Link to={`/users/${id}/following`} className="user-profile__stat">
            <span className="user-profile__stat-value">{currentUser.followingCount || 0}</span>
            <span className="user-profile__stat-label">Following</span>
          </Link>
        </div>

        <div className="user-profile__content">
          {currentUser.bio && (
            <div className="user-profile__section">
              <h3>About</h3>
              <p>{currentUser.bio}</p>
            </div>
          )}

          {currentUser.skills?.length > 0 && (
            <div className="user-profile__section">
              <h3>Skills</h3>
              <div className="user-profile__skills">
                {currentUser.skills.map((skill, index) => (
                  <span key={index} className="user-profile__skill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentUser.socialLinks && Object.values(currentUser.socialLinks).some(Boolean) && (
            <div className="user-profile__section">
              <h3>Social Links</h3>
              <div className="user-profile__social">
                {currentUser.socialLinks.github && (
                  <a href={currentUser.socialLinks.github} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                )}
                {currentUser.socialLinks.twitter && (
                  <a href={currentUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                )}
                {currentUser.socialLinks.linkedin && (
                  <a href={currentUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                )}
                {currentUser.socialLinks.website && (
                  <a href={currentUser.socialLinks.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default UserProfile;
