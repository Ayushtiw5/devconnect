import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchFollowers, fetchFollowing, fetchUserById } from '../features/users/usersSlice';
import { Card, Avatar, Spinner, Button } from '../components/ui';
import FollowButton from '../components/FollowButton';
import './FollowList.css';

function FollowList({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { followers, following, currentUser, pagination, isLoading } = useSelector(
    (state) => state.users
  );
  const { user: authUser } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);

  const list = type === 'followers' ? followers : following;
  const title = type === 'followers' ? 'Followers' : 'Following';

  useEffect(() => {
    dispatch(fetchUserById(id));
    
    if (type === 'followers') {
      dispatch(fetchFollowers({ userId: id, page, limit: 20 }));
    } else {
      dispatch(fetchFollowing({ userId: id, page, limit: 20 }));
    }
  }, [dispatch, id, type, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="follow-list">
      <Card className="follow-list__card">
        <div className="follow-list__header">
          <button onClick={() => navigate(-1)} className="follow-list__back">
            ← Back
          </button>
          <h1 className="follow-list__title">
            {currentUser?.name}'s {title}
          </h1>
        </div>

        {isLoading ? (
          <div className="follow-list__loading">
            <Spinner size="lg" />
          </div>
        ) : list.length === 0 ? (
          <div className="follow-list__empty">
            <p>No {type} yet.</p>
          </div>
        ) : (
          <>
            <div className="follow-list__users">
              {list.map((user) => (
                <div key={user.id || user._id} className="follow-list__user">
                  <Link to={`/users/${user.id || user._id}`} className="follow-list__user-link">
                    <Avatar name={user.name} src={user.avatar} size="md" />
                    <div className="follow-list__user-info">
                      <span className="follow-list__user-name">{user.name}</span>
                      {user.bio && (
                        <span className="follow-list__user-bio">{user.bio}</span>
                      )}
                    </div>
                  </Link>
                  {authUser && authUser.id !== (user.id || user._id) && (
                    <FollowButton 
                      userId={user.id || user._id} 
                      isFollowing={user.isFollowing}
                    />
                  )}
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="follow-list__pagination">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="follow-list__pagination-info">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default FollowList;
