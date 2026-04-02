/**
 * Recursively sanitize object values in-place
 * - Removes NoSQL injection operators ($, .)
 * - Basic XSS removal (strips < and > from strings)
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;

  const keysToDelete = [];

  for (const key in obj) {
    // Mark NoSQL injection operators for deletion
    if (key.startsWith('$') || key.includes('.')) {
      keysToDelete.push(key);
      continue;
    }

    const value = obj[key];

    if (typeof value === 'string') {
      // Basic XSS sanitization - remove script tags and common XSS patterns
      obj[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string') {
          value[i] = value[i]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        } else if (typeof value[i] === 'object') {
          sanitizeObject(value[i]);
        }
      }
    } else if (typeof value === 'object') {
      sanitizeObject(value);
    }
  }

  // Delete marked keys
  for (const key of keysToDelete) {
    delete obj[key];
  }
};

/**
 * Sanitization middleware
 * Protects against XSS and NoSQL injection attacks
 * Note: In Express 5, req.query and req.params are read-only,
 * so we only sanitize req.body (which is writable)
 */
const sanitize = (req, res, next) => {
  // Sanitize body in-place (body is writable)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

module.exports = sanitize;
