import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateProfile, clearError, logout } from '../features/auth/authSlice';
import { Card, Avatar, Button, Input, Textarea } from '../components/ui';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Profile.css';

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    github: user?.socialLinks?.github || '',
    twitter: user?.socialLinks?.twitter || '',
    linkedin: user?.socialLinks?.linkedin || '',
    website: user?.socialLinks?.website || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updateData = {
      name: formData.name,
      bio: formData.bio,
      skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      socialLinks: {
        github: formData.github || undefined,
        twitter: formData.twitter || undefined,
        linkedin: formData.linkedin || undefined,
        website: formData.website || undefined,
      },
    };

    const result = await dispatch(updateProfile(updateData));
    
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(result.payload || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      skills: user?.skills?.join(', ') || '',
      github: user?.socialLinks?.github || '',
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
      website: user?.socialLinks?.website || '',
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    // For Google OAuth users, no password needed
    const isGoogleUser = user?.googleId && !user?.hasPassword;
    
    if (!isGoogleUser && !deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users/me', { 
        data: { password: deletePassword } 
      });
      toast.success('Account deleted successfully');
      dispatch(logout());
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      toast.error(errorMessage);
      // Clear password field on error
      setDeletePassword('');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile">
      <Card className="profile__card">
        <div className="profile__header">
          <Avatar name={user.name} src={user.avatar} size="2xl" />
          <div className="profile__info">
            <h1 className="profile__name">{user.name}</h1>
            <p className="profile__email">{user.email}</p>
            <p className="profile__role">{user.role}</p>
          </div>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="profile__stats">
          <Link to={`/users/${user.id}/followers`} className="profile__stat">
            <span className="profile__stat-value">{user.followerCount || 0}</span>
            <span className="profile__stat-label">Followers</span>
          </Link>
          <Link to={`/users/${user.id}/following`} className="profile__stat">
            <span className="profile__stat-value">{user.followingCount || 0}</span>
            <span className="profile__stat-label">Following</span>
          </Link>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile__form">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Textarea
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              maxLength={500}
            />

            <Input
              label="Skills (comma-separated)"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB..."
            />

            <div className="profile__form-section">
              <h3>Social Links</h3>
              <Input
                label="GitHub"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/username"
              />
              <Input
                label="Twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/username"
              />
              <Input
                label="LinkedIn"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
              />
              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="profile__form-actions">
              <Button type="submit" loading={isLoading}>
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>

            {/* Delete Account Section */}
            <div className="profile__danger-zone">
              <h3>NOTE</h3>
              <p>Once you delete your account, there is no going back. All your posts, comments, and data will be permanently removed.</p>
              <Button 
                type="button" 
                variant="danger" 
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="fa-regular fa-trash-can"></i> Delete Account
              </Button>
            </div>
          </form>
        ) : (
          <div className="profile__content">
            {user.bio && (
              <div className="profile__section">
                <h3>About</h3>
                <p>{user.bio}</p>
              </div>
            )}

            {user.skills?.length > 0 && (
              <div className="profile__section">
                <h3>Skills</h3>
                <div className="profile__skills">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="profile__skill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
              <div className="profile__section">
                <h3>Social Links</h3>
                <div className="profile__social">
                  {user.socialLinks.github && (
                    <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  )}
                  {user.socialLinks.twitter && (
                    <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  )}
                  {user.socialLinks.linkedin && (
                    <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {user.socialLinks.website && (
                    <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="profile__modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="profile__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            
            {!user?.googleId && (
              <Input
                type="password"
                label="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
              />
            )}
            
            <div className="profile__modal-actions">
              <Button 
                variant="danger" 
                onClick={handleDeleteAccount}
                loading={isDeleting}
              >
                Yes, Delete My Account
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
