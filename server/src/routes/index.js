const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

// API v1 routes
const v1Router = express.Router();

// Health check (available at both /api/health and /api/v1/health)
router.use('/health', healthRoutes);
v1Router.use('/health', healthRoutes);

// Auth routes
v1Router.use('/auth', authRoutes);

// User routes
v1Router.use('/users', userRoutes);

// Post routes
v1Router.use('/posts', postRoutes);

// Notification routes
v1Router.use('/notifications', notificationRoutes);

// Mount v1 router
router.use('/v1', v1Router);

module.exports = router;
