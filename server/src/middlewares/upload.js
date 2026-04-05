const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const fs = require('fs');

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp-index-originalname
    const uniqueSuffix = `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpeg, jpg, png, gif, webp)', 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size per image
    files: 4, // Max 4 images per post
  },
});

// Export upload middleware for multiple images (max 4)
const uploadPostImages = upload.array('images', 4);

// Wrapper to handle multer errors
const handleUpload = (req, res, next) => {
  uploadPostImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Each file size cannot exceed 5MB', 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Maximum 4 images allowed per post', 400));
      }
      return next(new AppError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadPostImage: handleUpload,
};
