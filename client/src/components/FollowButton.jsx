import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { followUser, unfollowUser } from '../features/users/usersSlice';
import { Button } from './ui';
import toast from 'react-hot-toast';
import './FollowButton.css';

function FollowButton({ userId, isFollowing: initialIsFollowing, onFollowChange }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow users');
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        const result = await dispatch(unfollowUser(userId));
        if (unfollowUser.fulfilled.match(result)) {
          setIsFollowing(false);
          toast.success('Unfollowed successfully');
          onFollowChange?.(false, result.payload.followerCount);
        } else {
          toast.error(result.payload || 'Failed to unfollow');
        }
      } else {
        const result = await dispatch(followUser(userId));
        if (followUser.fulfilled.match(result)) {
          setIsFollowing(true);
          toast.success('Following!');
          onFollowChange?.(true, result.payload.followerCount);
        } else {
          toast.error(result.payload || 'Failed to follow');
        }
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  return (
    <Button
      variant={isFollowing ? (isHovered ? 'danger' : 'secondary') : 'primary'}
      size="sm"
      onClick={handleClick}
      loading={isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`follow-btn ${isFollowing ? 'follow-btn--following' : ''}`}
    >
      {getButtonText()}
    </Button>
  );
}

export default FollowButton;
