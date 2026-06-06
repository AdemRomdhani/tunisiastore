const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Global error handlers
const { captureException } = require('./src/config/sentry.config');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  captureException(reason, { extra: { type: 'unhandledRejection' } });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  captureException(error, { extra: { type: 'uncaughtException' } });
  process.exit(1);
});

require('dotenv').config();

const { initSentry, Sentry } = require('./src/config/sentry.config');
initSentry();

const CacheService = require('./src/services/cache.service');
const AbandonedCartService = require('./src/services/abandoned-cart.service');
const security = require('./src/middleware/security');

console.log('ENV CHECK - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('ENV CHECK - NODE_ENV:', process.env.NODE_ENV);
console.log('ENV CHECK - FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();

app.set('trust proxy', 1);

// ===== LOGGING (for debugging) =====
app.use(morgan('dev'));

// ===== CORS - Must be first to handle preflight =====
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://tunisiastore.onrender.com', 'https://tunisia-store-frontend.onrender.com', 'https://tunisiastore-5twr.onrender.com']
      : ['http://localhost:4200', 'http://localhost:3000', 'http://localhost:5000'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-requested-with', 'X-Custom-Auth'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS before all other middleware to ensure preflight requests get proper headers
app.use(cors(corsOptions));

// Handle preflight explicitly for all routes
app.options('*', cors(corsOptions));

// ===== COMPRESSION =====
app.use(compression());

// ===== SECURITY MIDDLEWARE =====
security.setupSecurity(app);

// Cookie parser for JWT in cookies
app.use(cookieParser());

// Reduced JSON payload limit (prevents DoS)
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Static files - uploads and Angular build
app.use('/uploads', express.static('uploads'));

// Serve Angular static files
const rootDir = path.resolve(__dirname, '..');
const distPath = path.join(rootDir, 'dist/tunisia-store/browser');
console.log('📁 Serving static files from:', distPath);
app.use(express.static(distPath));

// Routes
console.log('🔄 Loading routes...');
app.use('/api/auth', require('./src/routes/auth.routes'));
console.log('✓ Auth routes loaded');
app.use('/api/products', require('./src/routes/product.routes'));
console.log('✓ Products routes loaded');
app.use('/api/categories', require('./src/routes/category.routes'));
console.log('✓ Categories routes loaded');
app.use('/api/cart', require('./src/routes/cart.routes'));
console.log('✓ Cart routes loaded');
app.use('/api/orders', require('./src/routes/order.routes'));
console.log('✓ Orders routes loaded');
app.use('/api/admin', require('./src/routes/admin.routes'));
console.log('✓ Admin routes loaded');
app.use('/api/coupons', require('./src/routes/coupon.routes'));
console.log('✓ Coupons routes loaded');
app.use('/api/wishlist', require('./src/routes/wishlist.routes'));
console.log('✓ Wishlist routes loaded');
app.use('/api/newsletter', require('./src/routes/newsletter.routes'));
console.log('✓ Newsletter routes loaded');
app.use('/api/recently-viewed', require('./src/routes/recentlyViewed.routes'));
console.log('✓ Recently-viewed routes loaded');
app.use('/api/cms', require('./src/routes/cms.routes'));
console.log('✓ CMS routes loaded');
app.use('/api/bundles', require('./src/routes/bundle.routes'));
console.log('✓ Bundles routes loaded');
app.use('/api/contact', require('./src/routes/contact.routes'));
console.log('✓ Contact routes loaded');
app.use('/api/reviews', require('./src/routes/review.routes'));
console.log('✓ Reviews routes loaded');
app.use('/api/returns', require('./src/routes/return.routes'));
console.log('✓ Returns routes loaded');
app.use('/api/audit', require('./src/routes/audit.routes'));
console.log('✓ Audit routes loaded');
app.use('/api/shipping', require('./src/routes/shipping.routes'));
console.log('✓ Shipping routes loaded');
app.use('/api/payments', require('./src/routes/payment.routes'));
console.log('✓ Payments routes loaded');

// Public health check - MUST be before protected routes or outside auth middleware
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Cache health & stats endpoint
app.get('/api/health/cache', async (req, res) => {
  res.json({
    status: 'OK',
    cache: CacheService.getStats()
  });
});

// SPA fallback - serve index.html for all non-API routes (MUST be last)
app.get(/^(?!\/api\/).*/, (req, res) => {
  const indexPath = path.join(rootDir, 'dist/tunisia-store/browser/index.html');
  console.log('📄 SPA fallback for:', req.path, '| index exists:', require('fs').existsSync(indexPath));
  res.sendFile(indexPath);
});

// Error handler - masks internal errors in production
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);

  // Capture error in Sentry
  Sentry.captureException(err, {
    extra: {
      path: req.path,
      method: req.method,
      body: req.body,
      userId: req.user?.id
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && err.status !== 400
    ? 'Internal server error'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Only start server if not in test mode
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  // Connect to MongoDB and seed
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tunisia_store')
    .then(() => {
      console.log('✅ MongoDB Connected');
      seedCategories();
      startSaleScheduler();
      startAbandonedCartScheduler();
    })
    .catch(err => { console.error(err); process.exit(1); });

  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
} else {
  console.log('🧪 Test mode: server not started, DB and schedulers must be initialized by tests');
}

// ============ HELPER FUNCTIONS ============

// Auto-disable expired sales every minute
async function startSaleScheduler() {
  const Product = require('./src/models/Product');
  
  const disableExpiredSales = async () => {
    try {
      // Find products with expired sale dates
      const expiredProducts = await Product.find({ 
        onSale: true, 
        saleEndsAt: { $lt: new Date() } 
      });
      
      if (expiredProducts.length > 0) {
        const productIds = expiredProducts.map(p => p._id);
        
        // Update all expired products - disable onSale and remove PROMO badge
        await Product.updateMany(
          { _id: { $in: productIds } },
          { 
            $set: { onSale: false },
            $pull: { badges: 'PROMO' }
          }
        );
        console.log(`🔄 Auto-disabled ${productIds.length} expired sales`);
      }
    } catch (err) {
      console.error('Sale scheduler error:', err.message);
    }
  };
  
  // Run every minute
  setInterval(disableExpiredSales, 60 * 1000);
  // Also run immediately on startup
  disableExpiredSales();
}

// Abandoned cart recovery scheduler - run every 30 minutes
async function startAbandonedCartScheduler() {
  const runRecovery = async () => {
    try {
      await AbandonedCartService.processAbandonedCarts();
    } catch (err) {
      console.error('[AbandonedCart] Scheduler error:', err.message);
    }
  };
  
  // Run every 30 minutes
  setInterval(runRecovery, 30 * 60 * 1000);
  // Also run immediately on startup (after a short delay)
  setTimeout(runRecovery, 60 * 1000);
  
  console.log('[AbandonedCart] Recovery scheduler started (every 30 min)');
}

// Seed default categories
async function seedCategories() {
  const Category = require('./src/models/Category');
  const categories = [
    { name: 'Smartphones', slug: 'smartphones', order: 1 },
    { name: 'Computers', slug: 'computers', order: 2 },
    { name: 'Tablets', slug: 'tablets', order: 3 },
    { name: 'Accessories', slug: 'accessories', order: 4 },
    { name: 'Wearables', slug: 'wearables', order: 5 },
    { name: 'Gaming', slug: 'gaming', order: 6 }
  ];
  
  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Categories seeded');
}

module.exports = { app, CacheService, AbandonedCartService };
