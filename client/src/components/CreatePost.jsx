import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost } from '../features/posts/postsSlice';
import { Avatar, Button, Textarea } from './ui';
import toast from 'react-hot-toast';
import './CreatePost.css';

const MAX_IMAGES = 4;

function CreatePost() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.posts);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed per post`);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only image files allowed`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Size cannot exceed 5MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && images.length === 0) {
      toast.error('Post cannot be empty');
      return;
    }

    if (text.length > 2000) {
      toast.error('Post is too long (max 2000 characters)');
      return;
    }

    // Create FormData if there are images, otherwise send plain object
    let postData;
    if (images.length > 0) {
      postData = new FormData();
      postData.append('text', text.trim());
      images.forEach(image => {
        postData.append('images', image);
      });
    } else {
      postData = { text: text.trim() };
    }

    const result = await dispatch(createPost(postData));
    
    if (createPost.fulfilled.match(result)) {
      toast.success('Post created!');
      setText('');
      setImages([]);
      setImagePreviews([]);
      setIsExpanded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error(result.payload || 'Failed to create post');
    }
  };

  const handleCancel = () => {
    setText('');
    setImages([]);
    setImagePreviews([]);
    setIsExpanded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="create-post">
      <div className="create-post__header">
        <Avatar name={user?.name} src={user?.avatar} size="md" />
        {!isExpanded ? (
          <button
            className="create-post__trigger"
            onClick={() => setIsExpanded(true)}
          >
            <span>What's on your mind, {user?.name?.split(' ')[0]}?</span>
            <i className="fa-solid fa-paper-plane create-post__trigger-icon"></i>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="create-post__form">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your thoughts, code, or ideas..."
              autoFocus
              maxLength={2000}
              rows={4}
            />
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="create-post__image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="create-post__image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="create-post__image-remove"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="create-post__footer">
              <div className="create-post__tools">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="create-post__file-input"
                  id="post-image"
                  multiple
                />
                <label 
                  htmlFor="post-image" 
                  className={`create-post__image-btn ${images.length >= MAX_IMAGES ? 'create-post__image-btn--disabled' : ''}`}
                  title={images.length >= MAX_IMAGES ? 'Maximum images reached' : 'Add images (max 4)'}
                >
                  <i className="fa-regular fa-camera"></i> {images.length > 0 && <span className="create-post__image-count">{images.length}/{MAX_IMAGES}</span>}
                </label>
                <span className="create-post__char-count">
                  {text.length}/2000
                </span>
              </div>
              <div className="create-post__actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isLoading}
                  disabled={!text.trim() && images.length === 0}
                >
                  Post
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreatePost;
