const Joi = require('joi');
const AppError = require('../utils/AppError');

/**
 * Validate add comment request
 */
exports.validateAddComment = (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Comment text is required',
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment text is required',
    }),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }

  req.body = value;
  next();
};

/**
 * Validate get comments query params
 */
exports.validateGetCommentsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sort: Joi.string().valid('newest', 'oldest').default('newest'),
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }

  req.query = value;
  next();
};

/**
 * Validate get likes query params
 */
exports.validateGetLikesQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return next(new AppError('Validation failed', 400, errors));
  }

  req.query = value;
  next();
};
