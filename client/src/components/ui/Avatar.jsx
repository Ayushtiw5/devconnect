import { useState } from 'react';
import './Avatar.css';

function Avatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Check if src is a valid URL
  const isValidUrl = (str) => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
  };

  const showImage = src && isValidUrl(src) && !imgError;

  return (
    <div className={`avatar avatar--${size} ${className}`}>
      {showImage ? (
        <img 
          src={src} 
          alt={name || 'Avatar'} 
          className="avatar__image" 
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="avatar__initials">{getInitials(name)}</span>
      )}
    </div>
  );
}

export default Avatar;
