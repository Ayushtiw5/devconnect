import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, clearPosts } from '../features/posts/postsSlice';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { Spinner, Button } from '../components/ui';
import './Feed.css';

function Feed() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { posts, pagination, isLoading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, limit: 10 }));

    return () => {
      dispatch(clearPosts());
    };
  }, [dispatch]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      dispatch(fetchPosts({ page: pagination.page + 1, limit: 10 }));
    }
  };

  return (
    <div className="feed">
      <div className="feed__header">
        <h1>Your Feed</h1>
        <p>Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      <CreatePost />

      {error && (
        <div className="feed__error">
          <p>{error}</p>
          <Button onClick={() => dispatch(fetchPosts({ page: 1, limit: 10 }))}>
            Retry
          </Button>
        </div>
      )}

      <div className="feed__posts">
        {posts.map((post) => (
          <PostCard key={post.id || post._id} post={post} />
        ))}
      </div>

      {isLoading && (
        <div className="feed__loading">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && posts.length === 0 && !error && (
        <div className="feed__empty">
          <h3>No posts yet</h3>
          <p>Be the first to share something!</p>
        </div>
      )}

      {pagination.hasMore && !isLoading && (
        <div className="feed__load-more">
          <Button variant="secondary" onClick={handleLoadMore}>
            Load More Posts
          </Button>
        </div>
      )}

      {!pagination.hasMore && posts.length > 0 && (
        <div className="feed__end">
          <p>You've reached the end 🎉</p>
        </div>
      )}
    </div>
  );
}

export default Feed;
