import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updatePost, deletePost, toggleLike } from '../features/posts/postsSlice';
import { Avatar, Button, Textarea, Card } from './ui';
import CommentSection from './CommentSection';
import toast from 'react-hot-toast';
import './PostCard.css';

function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === post.author?.id || user?.id === post.author?._id;
  const isAdmin = user?.role === 'admin';
  const canModify = isOwner || isAdmin;

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }
    
    setIsLiking(true);
    const result = await dispatch(toggleLike(post.id || post._id));
    setIsLiking(false);
    
    if (toggleLike.rejected.match(result)) {
      toast.error(result.payload || 'Failed to like post');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    if (!editText.trim()) {
      toast.error('Post cannot be empty');
      return;
    }

    const result = await dispatch(updatePost({
      postId: post.id || post._id,
      data: { text: editText.trim() }
    }));
    
    if (updatePost.fulfilled.match(result)) {
      toast.success('Post updated!');
      setIsEditing(false);
    } else {
      toast.error(result.payload || 'Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsDeleting(true);
    const result = await dispatch(deletePost(post.id || post._id));
    
    if (deletePost.fulfilled.match(result)) {
      toast.success('Post deleted!');
    } else {
      toast.error(result.payload || 'Failed to delete post');
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(post.text);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Card className={`post-card ${isDeleting ? 'post-card--deleting' : ''}`}>
      <div className="post-card__header">
        <Link to={`/users/${post.author?.id || post.author?._id}`} className="post-card__author">
          <Avatar 
            name={post.author?.name} 
            src={post.author?.avatar} 
            size="md" 
          />
          <div className="post-card__author-info">
            <span className="post-card__author-name">{post.author?.name}</span>
            <span className="post-card__date">{formatDate(post.createdAt)}</span>
          </div>
        </Link>
        
        {canModify && (
          <div className="post-card__menu">
            {isOwner && (
              <button 
                className="post-card__menu-btn"
                onClick={() => setIsEditing(true)}
                title="Edit post"
              >
                <i className="fa-regular fa-pen-to-square"></i>
              </button>
            )}
            <button 
              className="post-card__menu-btn post-card__menu-btn--danger"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete post"
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          </div>
        )}
      </div>

      <div className="post-card__content">
        {isEditing ? (
          <form onSubmit={handleEdit} className="post-card__edit-form">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              maxLength={2000}
              autoFocus
            />
            <div className="post-card__edit-actions">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!editText.trim()}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <>
            {post.text && <p className="post-card__text">{post.text}</p>}
            {post.images && post.images.length > 0 && (
              <div className={`post-card__images ${post.images.length === 1 ? 'post-card__images--single' : ''}`}>
                <div className="post-card__images-scroll">
                  {post.images.map((image, index) => (
                    <div key={index} className="post-card__image">
                      <img 
                        src={`http://localhost:5000${image}`} 
                        alt={`Post image ${index + 1}`} 
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
                {post.images.length > 1 && (
                  <div className="post-card__images-indicator">
                    {post.images.length} images • scroll to view
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="post-card__stats">
        <span>{post.likeCount || post.likesCount || 0} likes</span>
        <span>{post.commentsCount || 0} comments</span>
      </div>

      <div className="post-card__actions">
        <button 
          className={`post-card__action ${post.isLiked ? 'post-card__action--liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <i className={`fa-heart ${post.isLiked ? 'fa-solid' : 'fa-regular'}`}></i> Like
        </button>
        <button 
          className="post-card__action"
          onClick={() => setShowComments(!showComments)}
        >
          <i className="fa-regular fa-comment"></i> Comment
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id || post._id} />
      )}
    </Card>
  );
}

export default PostCard;
