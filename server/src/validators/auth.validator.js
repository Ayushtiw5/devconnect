const Joi = require('joi');

/**
 * Register validation schema
 */
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).optional().messages({
    'any.only': 'Passwords do not match',
  }),
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    // Replace body with validated value
    req.body = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  validate,
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
