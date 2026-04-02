const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post reference is required'],
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

// Index for fetching comments by post (sorted by createdAt)
commentSchema.index({ post: 1, createdAt: -1 });

// Index for fetching comments by author
commentSchema.index({ author: 1 });

// Method to format comment for response
commentSchema.methods.toPublicComment = function () {
  const comment = this.toObject();
  return {
    id: comment._id,
    text: comment.text,
    author: comment.author,
    post: comment.post,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
