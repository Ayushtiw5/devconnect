import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchComments, addComment, deleteComment } from '../features/posts/postsSlice';
import { Avatar, Button, Textarea, Spinner } from './ui';
import toast from 'react-hot-toast';
import './CommentSection.css';

function CommentSection({ postId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { comments } = useSelector((state) => state.posts);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const postComments = comments[postId];
  const commentList = postComments?.items || [];
  const pagination = postComments?.pagination;

  useEffect(() => {
    if (!postComments) {
      setIsLoading(true);
      dispatch(fetchComments({ postId, page: 1, limit: 10 }))
        .finally(() => setIsLoading(false));
    }
  }, [dispatch, postId, postComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(addComment({ postId, text: newComment.trim() }));
    setIsSubmitting(false);
    
    if (addComment.fulfilled.match(result)) {
      setNewComment('');
      toast.success('Comment added!');
    } else {
      toast.error(result.payload || 'Failed to add comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    setDeletingId(commentId);
    const result = await dispatch(deleteComment({ postId, commentId }));
    setDeletingId(null);
    
    if (deleteComment.fulfilled.match(result)) {
      toast.success('Comment deleted!');
    } else {
      toast.error(result.payload || 'Failed to delete comment');
    }
  };

  const loadMoreComments = () => {
    if (pagination?.hasMore) {
      setIsLoading(true);
      dispatch(fetchComments({ postId, page: pagination.page + 1, limit: 10 }))
        .finally(() => setIsLoading(false));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="comment-section">
      {user && (
        <form onSubmit={handleSubmit} className="comment-section__form">
          <Avatar name={user.name} src={user.avatar} size="sm" />
          <div className="comment-section__input-wrapper">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={1}
              maxLength={500}
            />
            <Button 
              type="submit" 
              size="sm" 
              loading={isSubmitting}
              disabled={!newComment.trim()}
            >
              Post
            </Button>
          </div>
        </form>
      )}

      {isLoading && commentList.length === 0 ? (
        <div className="comment-section__loading">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="comment-section__list">
          {commentList.length === 0 ? (
            <p className="comment-section__empty">No comments yet. Be the first!</p>
          ) : (
            commentList.map((comment) => {
              const isOwner = user?.id === (comment.author?.id || comment.author?._id);
              
              return (
                <div 
                  key={comment.id || comment._id} 
                  className={`comment ${deletingId === (comment.id || comment._id) ? 'comment--deleting' : ''}`}
                >
                  <Link to={`/users/${comment.author?.id || comment.author?._id}`}>
                    <Avatar 
                      name={comment.author?.name} 
                      src={comment.author?.avatar} 
                      size="sm" 
                    />
                  </Link>
                  <div className="comment__content">
                    <div className="comment__header">
                      <Link 
                        to={`/users/${comment.author?.id || comment.author?._id}`}
                        className="comment__author"
                      >
                        {comment.author?.name}
                      </Link>
                      <span className="comment__date">{formatDate(comment.createdAt)}</span>
                      {isOwner && (
                        <button 
                          className="comment__delete"
                          onClick={() => handleDelete(comment.id || comment._id)}
                          disabled={deletingId === (comment.id || comment._id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="comment__text">{comment.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {pagination?.hasMore && (
        <button 
          className="comment-section__load-more"
          onClick={loadMoreComments}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}

export default CommentSection;
