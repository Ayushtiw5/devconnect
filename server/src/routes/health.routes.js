const express = require('express');
const { sendSuccess } = require('../utils/responseHelpers');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  sendSuccess(res, 200, 'Server is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
