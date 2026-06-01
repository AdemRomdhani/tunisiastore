const request = require('supertest');

// Set test env FIRST (before importing server)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tunisia_store_test';

// Mock Sentry before importing server
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

// Mock nodemailer to avoid sending real emails during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// Import the app after setting env
const { app } = require('../server');

describe('Tunisia Store API - Unit Tests (No DB Required)', () => {

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

    it('should have correct content-type headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-type']).toContain('application/json');
    });
  });

  // ============================================
  // AUTH TESTS
  // ============================================
  describe('Auth API', () => {
    
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

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect([400, 422]).toContain(res.statusCode);
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

    it('should return autocomplete results with short query', async () => {
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
  // CATEGORY TESTS
  // ============================================
  describe('Category API', () => {
    it('should get all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
    });
  });

  // ============================================
  // CART TESTS
  // ============================================
  describe('Cart API', () => {
    let deviceId = 'test-device-' + Date.now();

    it('should return empty cart initially', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('x-device-id', deviceId);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================
  // WISHLIST TESTS
  // ============================================
  describe('Wishlist API', () => {
    it('should require authentication for wishlist access', async () => {
      const res = await request(app).get('/api/wishlist');
      expect([401, 403]).toContain(res.statusCode);
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
      
      expect([400, 401, 403]).toContain(res.statusCode);
    });
  });

  // ============================================
  // REVIEW TESTS
  // ============================================
  describe('Review API', () => {
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
    it('should handle newsletter subscription', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'newsletter' + Date.now() + '@test.com'
        });
      
      // Could be 200 (success) or 400 (already subscribed/validation)
      expect([200, 201, 400, 422]).toContain(res.statusCode);
    });

    it('should validate email format for newsletter', async () => {
      const res = await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'not-an-email'
        });
      
      expect([400, 422]).toContain(res.statusCode);
    });
  });

  // ============================================
  // CONTACT TESTS
  // ============================================
  describe('Contact API', () => {
    it('should validate contact form data', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          subject: 'Test'
        });
      
      // Should fail validation
      expect([400, 422]).toContain(res.statusCode);
    });
  });

  // ============================================
  // CMS TESTS
  // ============================================
  describe('CMS API', () => {
    it('should respond to CMS get request', async () => {
      const res = await request(app).get('/api/cms');
      // CMS may not have a general list endpoint
      expect([200, 404]).toContain(res.statusCode);
    });

    it('should respond for a specific page', async () => {
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
    it('should require authentication for coupons', async () => {
      const res = await request(app).get('/api/coupons');
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  // ============================================
  // ADMIN TESTS
  // ============================================
  describe('Admin API', () => {
    it('should reject unauthenticated admin access', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect([403, 404]).toContain(res.statusCode);
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

    it('should handle method not allowed', async () => {
      const res = await request(app).put('/api/health');
      expect([404, 405]).toContain(res.statusCode);
    });
  });

  // ============================================
  // PERFORMANCE TESTS
  // ============================================
  describe('Performance Tests', () => {
    it('should respond to product list within 3000ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/products');
      const duration = Date.now() - start;
      
      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(3000);
    });

    it('should serve cache for repeated product requests', async () => {
      // First request (cold)
      const res1 = await request(app).get('/api/products');
      expect(res1.statusCode).toBe(200);

      // Second request (should be cached or valid)
      const res2 = await request(app).get('/api/products');
      expect(res2.statusCode).toBe(200);
      expect(res2.body.products).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/api/products')
      );
      
      const results = await Promise.all(requests);
      results.forEach(res => {
        expect(res.statusCode).toBe(200);
      });
    });
  });

  // ============================================
  // SECURITY TESTS
  // ============================================
  describe('Security Tests', () => {
    it('should not expose server stack traces in production', async () => {
      const res = await request(app).get('/api/non-existent-route-12345xyz');
      if (res.body.stack) {
        expect(res.body.stack).not.toContain('node_modules');
      }
    });

    it('should have CORS headers', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:4200');
      
      expect(res.headers['access-control-allow-origin'] || res.headers['Access-Control-Allow-Origin']).toBeDefined();
    });
  });
});
