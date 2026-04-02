const Joi = require('joi');

/**
 * Update profile validation schema
 */
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
  }),
  bio: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Bio cannot exceed 500 characters',
  }),
  avatar: Joi.string().trim().uri().allow('').messages({
    'string.uri': 'Avatar must be a valid URL',
  }),
  skills: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(20)
    .messages({
      'array.max': 'Cannot have more than 20 skills',
    }),
  socialLinks: Joi.object({
    website: Joi.string().trim().uri().allow('').messages({
      'string.uri': 'Website must be a valid URL',
    }),
    github: Joi.string().trim().allow('').messages({}),
    linkedin: Joi.string().trim().allow('').messages({}),
    twitter: Joi.string().trim().allow('').messages({}),
  }),
}).min(1).messages({
  'object.min': 'At least one field is required to update',
});

/**
 * Search query validation schema
 */
const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).messages({
    'string.min': 'Search query is required',
    'string.max': 'Search query cannot exceed 100 characters',
  }),
  skills: Joi.alternatives()
    .try(
      Joi.string().trim(),
      Joi.array().items(Joi.string().trim())
    ),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sort: Joi.string().valid('name', 'createdAt', '-name', '-createdAt').default('-createdAt'),
});

/**
 * Pagination query validation schema
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
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

    // Replace with validated value
    if (source === 'body') {
      req.body = value;
    } else {
      req.query = value;
    }
    next();
  };
};

module.exports = {
  updateProfileSchema,
  searchQuerySchema,
  paginationSchema,
  validate,
  validateUpdateProfile: validate(updateProfileSchema),
  validateSearchQuery: validate(searchQuerySchema, 'query'),
  validatePagination: validate(paginationSchema, 'query'),
};
