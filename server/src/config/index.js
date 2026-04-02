const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
  JWT_SECRET: Joi.string().required().min(32).description('JWT secret key'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX: Joi.number().default(100),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),
}).unknown(); // Allow other env vars

// Validate environment variables
const { value: envVars, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const errorMessages = error.details.map((detail) => detail.message).join(', ');
  throw new Error(`Environment validation error: ${errorMessages}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoUri: envVars.MONGO_URI,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiresIn: envVars.JWT_EXPIRES_IN,
  clientUrl: envVars.CLIENT_URL,
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX,
  },
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    callbackUrl: envVars.GOOGLE_CALLBACK_URL,
  },
};

module.exports = config;
