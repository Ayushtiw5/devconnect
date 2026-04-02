const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (usually { id: userId })
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
