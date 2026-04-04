console.log('=== DEBUG ROUTE TEST ===');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const config = require('./config');
const routes = require('./routes');
const sanitize = require('./middlewares/sanitize');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

// Initialize passport config
require('./config/passport');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security: Set various HTTP headers (relaxed for development)
app.use(
  helmet({
    contentSecurityPolicy: config.env === 'production',
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - allow all origins in development
app.use(
  cors({
    origin: config.env === 'development' ? '*' : config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Development logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static files (for test UI)
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Sanitization middleware (XSS + NoSQL injection prevention)
app.use(sanitize);

// Initialize Passport
app.use(passport.initialize());

// API routes
app.use('/api', routes);

// Debug route to list all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // routes registered directly on the app
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      // router middleware 
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push(handler.route.path);
        }
      });
    }
  });
  res.json(routes);
});

// Debug route under /api to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  try {
    console.log('DEBUG: app._router:', app._router);
    if (!app._router || !app._router.stack) {
      return res.json({ success: false, message: 'No router stack found.' });
    }
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push(middleware.route.path);
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push(handler.route.path);
          }
        });
      }
    });
    res.json({ success: true, routes });
  } catch (err) {
    console.error('DEBUG ROUTE ERROR:', err);
    res.json({ success: false, message: err.message });
  }
});

// Add a root route for health check and to avoid 404 on '/'
app.get('/', (req, res) => {
  res.send('API is running');
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
