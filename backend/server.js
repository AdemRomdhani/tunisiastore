const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('ENV CHECK - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('ENV CHECK - NODE_ENV:', process.env.NODE_ENV);
console.log('ENV CHECK - FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();

app.set('trust proxy', 1);

// Explicit CORS - required for credentials
const corsOptions = {
  origin: 'https://tunisiastore.onrender.com',
  credentials: true
};
app.use(cors(corsOptions));

// Cookie parser for JWT in cookies
app.use(cookieParser());

// Rate limiting - general API
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Strict rate limiting for auth routes (brute force protection)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                    // 5 attempts
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/auth/forgot-password', strictLimiter);

// Security headers with Helmet (allow images to load)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression());
app.use(morgan('dev'));

// Reduced JSON payload limit (prevents DoS)
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tunisia_store')
  .then(() => {
    console.log('✅ MongoDB Connected');
    seedCategories();
    startSaleScheduler();
  })
  .catch(err => { console.error(err); process.exit(1); });

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

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api/categories', require('./src/routes/category.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));
app.use('/api/coupons', require('./src/routes/coupon.routes'));
app.use('/api/wishlist', require('./src/routes/wishlist.routes'));
app.use('/api/newsletter', require('./src/routes/newsletter.routes'));
app.use('/api/recently-viewed', require('./src/routes/recentlyViewed.routes'));
app.use('/api/cms', require('./src/routes/cms.routes'));
app.use('/api/bundles', require('./src/routes/bundle.routes'));
app.use('/api/contact', require('./src/routes/contact.routes'));
app.use('/api/reviews', require('./src/routes/review.routes'));
app.use('/api/returns', require('./src/routes/return.routes'));
app.use('/api/audit', require('./src/routes/audit.routes'));
app.use('/api/addresses', require('./src/routes/address.routes'));
app.use('/api/shipping', require('./src/routes/shipping.routes'));
app.use('/api/payments', require('./src/routes/payment.routes'));

// Public health check — MUST be before protected routes or outside auth middleware
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Test email endpoint
app.get('/api/test/email', async (req, res) => {
  const EmailService = require('./src/services/email.service');
  const User = require('./src/models/User');
  
  const user = await User.findOne({ role: 'admin' });
  if (!user) {
    return res.json({ success: false, message: 'No user found' });
  }
  
  const testOrder = {
    orderNumber: 'TEST-' + Date.now(),
    items: [{ name: 'Test Product', quantity: 1, price: 100 }],
    pricing: { subtotal: 100, shipping: 7, total: 107 },
    shipping: { estimatedDelivery: new Date() }
  };
  
  try {
    await EmailService.sendOrderConfirmation(testOrder, user);
    await EmailService.sendStatusUpdate(testOrder, user);
    res.json({ 
      success: true, 
      smtpConfigured: true,
      message: 'Emails sent - check your inbox (and spam folder)' 
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Error handler - masks internal errors in production
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));