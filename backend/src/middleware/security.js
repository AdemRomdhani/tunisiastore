// Global security middleware configuration for Tunisia Store API
// Covers: Input Sanitization, HTTPS, CSP, Rate Limiting

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const CacheService = require('../services/cache.service');

// ============ 1. INPUT SANITIZATION ============
function setupInputSanitization(app) {
  // Remove $ and . from query params to prevent NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[Sanitize] Sanitized key: ${key} in ${req.method} ${req.path}`);
    }
  }));

  // Custom body sanitization middleware
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }
    next();
  });

  console.log('✅ Input Sanitization: MongoDB injection protection enabled');
}

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove null bytes and control characters
      obj[key] = obj[key].replace(/\x00/g, '').replace(/[\x01-\x1F]/g, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// ============ 2. HTTPS ENFORCEMENT ============
function setupHttpsEnforcement(app) {
  app.use((req, res, next) => {
    // Check if request is HTTPS (works behind proxies/load balancers)
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (!isSecure && process.env.NODE_ENV === 'production') {
      // Redirect to HTTPS
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    
    // Set HSTS header for production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    
    next();
  });

  console.log('✅ HTTPS Enforcement: HSTS + redirect enabled for production');
}

// ============ 3. CONTENT SECURITY POLICY (CSP) ============
function setupCSP(app) {
  // Configure Helmet with strict CSP but allow cross-origin for CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,  // Disable for CORS compatibility
    crossOriginOpenerPolicy: false,    // Disable for CORS compatibility
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Angular needs inline scripts
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:",
          "https://res.cloudinary.com"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:4200",          // Angular dev server
          "http://localhost:3000",          // API
          "https://api.sms.to",
          "https://api.stripe.com"
        ],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xFrameOptions: { action: 'sameorigin' },
    xssFilter: true
  }));

  console.log('✅ Content Security Policy (CSP): Strict headers enabled (with CORS compatibility)');
}

// ============ 4. RATE LIMITING PER USER ============
const rateLimitCache = new Map(); // In-memory for now, can be Redis

function getRateLimiter(type = 'general') {
  const configs = {
    general: {
      windowMs: 60 * 1000, // 1 minute
      max: 200,
      message: { success: false, message: 'Too many requests' }
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      skipSuccessfulRequests: true,
      message: { 
        success: false, 
        message: 'Too many login attempts. Please try again in 15 minutes.' 
      }
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      max: 120,
      message: { success: false, message: 'API rate limit exceeded' }
    },
    admin: {
      windowMs: 60 * 1000,
      max: 500,
      message: { success: false, message: 'Admin rate limit exceeded' }
    }
  };

  const config = configs[type] || configs.general;

  return rateLimit({
    ...config,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Per-user rate limiting: use user ID if authenticated, otherwise IP
      if (req.user && req.user.id) {
        return `${type}:user:${req.user.id}`;
      }
      // For unauthenticated requests, use IP + device ID
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const deviceId = req.headers['x-device-id'] || 'no-device';
      return `${type}:ip:${ip}:${deviceId}`;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/api/health/cache';
    },
    handler: (req, res, next, options) => {
      res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
      res.status(options.statusCode || 429).json(options.message);
    }
  });
}

function setupRateLimiting(app) {
  // Rate limits are applied per-route with skip() logic to prevent
  // overlapping limiters from double-counting requests.
  
  // 1. Auth routes - strictest limits
  const authLimiter = getRateLimiter('auth');
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  
  // 2. Admin routes - higher limits for admin panel
  const adminLimiter = getRateLimiter('admin');
  app.use('/api/admin', adminLimiter);
  
  // 3. Standard API routes
  const apiLimiter = getRateLimiter('api');
  app.use('/api/products', apiLimiter);
  app.use('/api/categories', apiLimiter);
  app.use('/api/cart', apiLimiter);
  app.use('/api/orders', apiLimiter);
  
  // 4. Catch-all general limiter for other API routes
  // Skip if request path matches any of the specific routes above
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      if (req.user && req.user.id) {
        return `general:user:${req.user.id}`;
      }
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const deviceId = req.headers['x-device-id'] || 'no-device';
      return `general:ip:${ip}:${deviceId}`;
    },
    skip: (req) => {
      // Skip for health checks and already-rate-limited paths
      const path = req.path;
      if (path === '/api/health' || path === '/api/health/cache') return true;
      if (path.startsWith('/api/auth/')) return true;
      if (path.startsWith('/api/admin')) return true;
      if (path.startsWith('/api/products')) return true;
      if (path.startsWith('/api/categories')) return true;
      if (path.startsWith('/api/cart')) return true;
      if (path.startsWith('/api/orders')) return true;
      return false;
    },
    handler: (req, res) => {
      res.status(429).json({ success: false, message: 'Too many requests' });
    }
  });
  app.use('/api/', generalLimiter);

  console.log('✅ Per-User Rate Limiting: General(200/min), Auth(5/15min), API(120/min), Admin(500/min)');
}

// ============ 5. CORS SECURITY ============
function setupCorsSecurity(app) {
  // Already set in server.js, but we can enhance
  app.use((req, res, next) => {
    // Prevent browsers from MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  });

  console.log('✅ CORS Security: MIME sniffing prevention, referrer/permissions policies');
}

// ============ MAIN SETUP ============
function setupSecurity(app) {
  console.log('🛡️  Initializing Security Middleware...\n');
  
  setupInputSanitization(app);
  setupHttpsEnforcement(app);
  setupCSP(app);
  setupRateLimiting(app);
  setupCorsSecurity(app);
  
  console.log('\n🛡️  Security Stack: [Mongo-Sanitize] [HTTPS] [CSP] [Rate-Limit] [CORS]\n');
}

// Export individual functions for granular use
module.exports = {
  setupSecurity,
  getRateLimiter,
  setupInputSanitization,
  setupHttpsEnforcement,
  setupCSP,
  setupRateLimiting,
  setupCorsSecurity
};
