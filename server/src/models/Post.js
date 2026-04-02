const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Post cannot exceed 2000 characters'],
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 4;
        },
        message: 'Maximum 4 images allowed per post'
      }
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Index for feed queries (sort by createdAt desc)
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

// Method to check if user has liked the post
postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((id) => id.toString() === userId.toString());
};

// Method to format post for response
postSchema.methods.toFeedPost = function (currentUserId = null) {
  const post = this.toObject();
  return {
    id: post._id,
    text: post.text,
    images: post.images || [],
    author: post.author,
    likeCount: post.likes?.length || 0,
    commentsCount: post.commentsCount,
    isLiked: currentUserId ? this.isLikedBy(currentUserId) : false,
    isEdited: post.isEdited,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
