const Joi = require('joi');

/**
 * Create post validation schema
 * Text is optional if image is uploaded
 */
const createPostSchema = Joi.object({
  text: Joi.string().trim().max(2000).allow('').default('').messages({
    'string.max': 'Post cannot exceed 2000 characters',
  }),
});

/**
 * Update post validation schema
 */
const updatePostSchema = Joi.object({
  text: Joi.string().trim().min(1).max(2000).required().messages({
    'string.empty': 'Post text is required',
    'string.min': 'Post cannot be empty',
    'string.max': 'Post cannot exceed 2000 characters',
    'any.required': 'Post text is required',
  }),
});

/**
 * Get posts query validation schema
 */
const getPostsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sort: Joi.string().valid('createdAt', '-createdAt', 'likeCount', '-likeCount').default('-createdAt'),
  author: Joi.string().hex().length(24), // MongoDB ObjectId
});

/**
 * Validation middleware factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    if (source === 'body') {
      req.body = value;
    } else {
      req.query = value;
    }
    next();
  };
};

module.exports = {
  createPostSchema,
  updatePostSchema,
  getPostsQuerySchema,
  validate,
  validateCreatePost: validate(createPostSchema),
  validateUpdatePost: validate(updatePostSchema),
  validateGetPostsQuery: validate(getPostsQuerySchema, 'query'),
};
