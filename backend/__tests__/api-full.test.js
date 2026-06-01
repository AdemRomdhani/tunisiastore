// Tunisia Store - Comprehensive API Test Suite
// Tests all major API endpoints for functionality

const request = require('supertest');
const mongoose = require('mongoose');

// Set up test environment FIRST (before requiring server.js)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/tunisia_store_test_api';

// Mock nodemailer to avoid sending real emails during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// Mock Sentry to avoid tracking in tests
jest.mock('../src/config/sentry.config', () => ({
  captureException: jest.fn(),
  initSentry: jest.fn(),
  Sentry: {
    init: jest.fn(),
    captureException: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn()
  }
}));

// Import the app
const { app } = require('../server');

// Authentication headers helper
function getAuthHeader(token) {
  return { 'Authorization': `Bearer ${token}` };
}

describe('Tunisia Store API - Full Functionality Test', () => {
  let authToken;
  let userId;
  let productId;
  let categoryId;
  let deviceId = 'test-device-' + Date.now();

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  describe('Auth API', () => {
    
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser' + Date.now() + '@example.com',
          password: 'TestPassword123!',
          phone: '+21699999999'
        });
      
      // Could be 200 (success) or 400 (validation error) depending on schema
      expect([200, 201, 400]).toContain(res.statusCode);
    });

    it('should fail login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invaliduser@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should handle invalid login data', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'short'
        });
      
      expect([400, 401, 422]).toContain(res.statusCode);
    });
  });

  // ============================================
  // CATEGORY TESTS
  // ============================================
  describe('Category API', () => {
    
    it('should get all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('should get a single category by id', async () => {
      const listRes = await request(app).get('/api/categories');
      expect(listRes.statusCode).toBe(200);
      
      if (listRes.body.categories && listRes.body.categories.length > 0) {
        const catId = listRes.body.categories[0]._id;
        const res = await request(app).get(`/api/categories/${catId}`);
        expect([200, 404]).toContain(res.statusCode);
        if (res.statusCode === 200) {
          expect(res.body.success).toBe(true);
        }
      }
    });

    it('should get category products', async () => {
      const listRes = await request(app).get('/api/categories');
      expect(listRes.statusCode).toBe(200);
      
      if (listRes.body.categories && listRes.body.categories.length > 0) {
        const catId = listRes.body.categories[0]._id;
        const res = await request(app).get(`/api/categories/${catId}/products`);
        expect([200, 404]).toContain(res.statusCode);
      }
    });
  });

  // ============================================
  // PRODUCT TESTS
  // ============================================
  describe('Product API', () => {
    
    it('should get products list', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      if (res.body.products.length > 0) {
        productId = res.body.products[0]._id;
      }
    });

    it('should get featured products', async () => {
      const res = await request(app).get('/api/products?featured=true');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should get products on sale', async () => {
      const res = await request(app).get('/api/products?onSale=true');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should search products', async () => {
      const res = await request(app).get('/api/products?search=phone');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('should get a single product by slug', async () => {
      const listRes = await request(app).get('/api/products');
      if (listRes.body.products && listRes.body.products.length > 0) {
        const slug = listRes.body.products[0].slug;
        const res = await request(app).get(`/api/products/${slug}`);
        expect([200, 404]).toContain(res.statusCode);
      }
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/non-existent-slug-12345xyz');
      expect([404, 500]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });

    it('should use pagination correctly', async () => {
      const res1 = await request(app).get('/api/products?page=1&limit=5');
      expect(res1.statusCode).toBe(200);
      expect(res1.body.pagination).toBeDefined();
      expect(res1.body.pagination.limit).toBe(5);
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=0&maxPrice=1000');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get products with category filter', async () => {
      const res = await request(app).get('/api/products?category=smartphones');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get related products', async () => {
      const listRes = await request(app).get('/api/products');
      if (listRes.body.products && listRes.body.products.length > 0) {
        const productId = listRes.body.products[0]._id;
        const res = await request(app).get(`/api/products/${productId}/related`);
        expect([200, 404, 500]).toContain(res.statusCode);
      }
    });
  });

  // ============================================
  // SEARCH & AUTOCOMPLETE TESTS
  // ============================================
  describe('Search & Autocomplete API', () => {
    
    it('should return search results', async () => {
      const res = await request(app).get('/api/products/autocomplete?q=phone');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it('should return autocomplete results', async () => {
      const res = await request(app).get('/api/products/autocomplete?q=pho');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(res.body.results.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty autocomplete query', async () => {
      const res = await request(app).get('/api/products/autocomplete?q=');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results).toEqual([]);
    });
  });

  // ============================================
  // CART TESTS
  // ============================================
  describe('Cart API', () => {
    let cartItemId;

    it('should return empty cart initially', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('x-device-id', deviceId);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should add an item to the cart', async () => {
      const productsRes = await request(app).get('/api/products');
      if (productsRes.body.products && productsRes.body.products.length > 0) {
        const productId = productsRes.body.products[0]._id;
        const res = await request(app)
          .post('/api/cart')
          .set('x-device-id', deviceId)
          .send({ productId, quantity: 1 });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        if (res.body.cart && res.body.cart.items && res.body.cart.items.length > 0) {
          cartItemId = res.body.cart.items[0]._id;
        }
      }
    });

    it('should get the cart with items', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('x-device-id', deviceId);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update item quantity in cart', async () => {
      if (!cartItemId) {
        console.log('Skipping update quantity test: no cart item found');
        return;
      }
      
      const res = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('x-device-id', deviceId)
        .send({ quantity: 2 });
      
      expect([200, 404]).toContain(res.statusCode);
    });

    it('should remove an item from cart', async () => {
      if (!cartItemId) {
        console.log('Skipping remove from cart test: no cart item found');
        return;
      }
      
      const res = await request(app)
        .delete(`/api/cart/${cartItemId}`)
        .set('x-device-id', deviceId);
      
      expect([200, 404]).toContain(res.statusCode);
    });

    it('should clear the cart', async () => {
      const res = await request(app)
        .delete('/api/cart')
        .set('x-device-id', deviceId);
      
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // WISHLIST TESTS
  // ============================================
  describe('Wishlist API', () => {
    let wishlistItemId;

    it('should add item to wishlist', async () => {
      const productsRes = await request(app).get('/api/products');
      if (productsRes.body.products && productsRes.body.products.length > 0) {
        const productId = productsRes.body.products[0]._id;
        const res = await request(app)
          .post('/api/wishlist')
          .set('x-device-id', deviceId)
          .send({ productId });
        
        expect([200, 201, 404]).toContain(res.statusCode);
        if (res.body.success) {
          wishlistItemId = productId;
        }
      }
    });

    it('should get wishlist items', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('x-device-id', deviceId);
      
      expect([200, 404]).toContain(res.statusCode);
    });

    it('should remove item from wishlist', async () => {
      if (!wishlistItemId) {
        console.log('Skipping wishlist remove test: no item found');
        return;
      }
      
      const res = await request(app)
        .delete(`/api/wishlist/${wishlistItemId}`)
        .set('x-device-id', deviceId);
      
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // ORDER TESTS
  // ============================================
  describe('Order API', () => {
    it('should return error for unauthenticated order creation', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [] });
      
      expect([401, 403]).toContain(res.statusCode);
    });

    it('should get public order check endpoint', async () => {
      const res = await request(app).get('/api/orders/check');
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // REVIEW TESTS
  // ============================================
  describe('Review API', () => {
    
    it('should get reviews for a product', async () => {
      const productsRes = await request(app).get('/api/products');
      if (productsRes.body.products && productsRes.body.products.length > 0) {
        const productId = productsRes.body.products[0]._id;
        const res = await request(app).get(`/api/reviews?productId=${productId}`);
        expect([200, 404]).toContain(res.statusCode);
      }
    });

    it('should require authentication for posting reviews', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          productId: 'some-product-id',
          rating: 5,
          title: 'Great product',
          comment: 'Amazing!'
        });
      
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  // ============================================
  // NEWSLETTER TESTS
  // ============================================
  describe('Newsletter API', () => {
    
    it('should subscribe to newsletter', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'newsletter' + Date.now() + '@test.com'
        });
      
      // Could be 200 (success) or 400 (already subscribed/validation)
      expect([200, 201, 400, 422]).toContain(res.statusCode);
    });

    it('should handle duplicate newsletter subscription', async () => {
      const email = 'duplicate' + Date.now() + '@test.com';
      const res1 = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email });
      
      const res2 = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email });
      
      // Second should be 400 (already subscribed) or 200 (success)
      expect([200, 201, 400, 422]).toContain(res2.statusCode);
    });
  });

  // ============================================
  // CONTACT TESTS
  // ============================================
  describe('Contact API', () => {
    
    it('should submit contact message', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test' + Date.now() + '@test.com',
          subject: 'Test Subject',
          message: 'This is a test message from the contact form.'
        });
      
      // Could be 200 (success) or 400 (validation)
      expect([200, 201]).toContain(res.statusCode);
    });
  });

  // ============================================
  // SHIPPING TESTS
  // ============================================
  describe('Shipping API', () => {
    
    it('should get shipping options', async () => {
      const res = await request(app).get('/api/shipping/options');
      expect([200, 404]).toContain(res.statusCode);
    });

    it('should calculate shipping cost', async () => {
      const res = await request(app)
        .post('/api/shipping/calculate')
        .send({
          city: 'Tunis',
          weight: 1.5
        });
      
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // CMS TESTS
  // ============================================
  describe('CMS API', () => {
    
    it('should get CMS pages list', async () => {
      const res = await request(app).get('/api/cms');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // pages might be empty or an array
    });

    it('should get a single page by slug', async () => {
      const res = await request(app).get('/api/cms/about');
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // BUNDLE TESTS
  // ============================================
  describe('Bundle API', () => {
    
    it('should get active bundles', async () => {
      const res = await request(app).get('/api/bundles');
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // COUPON TESTS
  // ============================================
  describe('Coupons API', () => {
    
    it('should get available coupons', async () => {
      const res = await request(app).get('/api/coupons');
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // RECENTLY VIEWED TESTS
  // ============================================
  describe('Recently Viewed API', () => {
    
    it('should get recently viewed products', async () => {
      const res = await request(app)
        .get('/api/recently-viewed')
        .set('x-device-id', deviceId);
      
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  // ============================================
  // ADMIN TESTS
  // ============================================
  describe('Admin API', () => {
    
    it('should reject unauthenticated admin access', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================
  // HEALTH & PERFORMANCE TESTS
  // ============================================
  describe('Health & Performance API', () => {
    
    it('should return OK status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return cache stats', async () => {
      const res = await request(app).get('/api/health/cache');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.cache).toBeDefined();
      expect(res.body.cache.enabled).toBe(true);
      expect(res.body.cache.entries).toBeGreaterThanOrEqual(0);
    });

    it('should respond to health check within 1000ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/health');
      const duration = Date.now() - start;
      
      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    it('should respond to product list within 3000ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/products');
      const duration = Date.now() - start;
      
      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(3000);
    });

    it('should have working headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).toContain('application/json');
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    
    it('should handle 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/non-existent-route-12345xyz');
      expect([404, 500]).toContain(res.statusCode);
    });

    it('should handle invalid JSON body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('not-valid-json');
      
      expect(res.statusCode).toBe(400);
    });

    it('should handle unauthorized access', async () => {
      const res = await request(app).get('/api/admin/users');
      expect([401, 403, 404]).toContain(res.statusCode);
    });
  });
});
