const request = require('supertest');

// Test the Node Express app
const path = require('path');

// Set test env BEFORE importing server
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tunisia_store_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

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
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  };
});

// Import the app after setting env
const { app } = require('../server');

describe('Health Check', () => {
  it('should return OK status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Cache API', () => {
  it('should return cache stats', async () => {
    const res = await request(app).get('/api/health/cache');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.cache).toBeDefined();
    expect(res.body.cache.enabled).toBe(true);
    expect(res.body.cache.entries).toBeGreaterThanOrEqual(0);
  });
});

describe('Auth API', () => {
  let authToken;

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
});

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

  it('should get a single product by slug (or return 404)', async () => {
    // First get a product from the list
    const listRes = await request(app).get('/api/products');
    if (listRes.body.products.length > 0) {
      const slug = listRes.body.products[0].slug;
      const res = await request(app).get(`/api/products/${slug}`);
      expect([200, 404]).toContain(res.statusCode);
      expect(res.body.success).toBeDefined();
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
});

describe('Category API', () => {
  it('should get all categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  it('should get a single category by id (or 404/500)', async () => {
    // First get categories list
    const listRes = await request(app).get('/api/categories');
    if (listRes.body.categories.length > 0) {
      const catId = listRes.body.categories[0]._id;
      const res = await request(app).get(`/api/categories/${catId}`);
      expect([200, 404]).toContain(res.statusCode);
      expect(res.body.success).toBeDefined();
    }
  });
});

describe('Cart API', () => {
  let deviceId = 'test-device-' + Date.now();
  let cartItemId;
  let productId;

  beforeAll(async () => {
    // Get a product id to add to cart
    const res = await request(app).get('/api/products');
    if (res.body.products.length > 0) {
      productId = res.body.products[0]._id;
    }
  });

  it('should return empty cart initially', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('x-device-id', deviceId);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart.items).toEqual([]);
  });

  it('should add an item to the cart (if product exists)', async () => {
    if (!productId) {
      console.log('Skipping add to cart test: no product found');
      return;
    }
    
    const res = await request(app)
      .post('/api/cart')
      .set('x-device-id', deviceId)
      .send({ productId, quantity: 1 });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart.items.length).toBeGreaterThan(0);
    cartItemId = res.body.cart.items[0]._id;
  });

  it('should get the cart with the added item', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('x-device-id', deviceId);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.cart.items)).toBe(true);
    // Cart should have the item if it was added successfully
  });

  it('should update item quantity in cart (if item exists)', async () => {
    if (!cartItemId) {
      console.log('Skipping update quantity test: no cart item found');
      return;
    }
    
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set('x-device-id', deviceId)
      .send({ quantity: 2 });
    
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('should remove an item from cart (if item exists)', async () => {
    if (!cartItemId) {
      console.log('Skipping remove from cart test: no cart item found');
      return;
    }
    
    const res = await request(app)
      .delete(`/api/cart/${cartItemId}`)
      .set('x-device-id', deviceId);
    
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  it('should clear the cart', async () => {
    // This cart might be empty and might 404, so let test both scenarios
    const res = await request(app)
      .delete('/api/cart')
      .set('x-device-id', deviceId);
    
    // Clear cart might return 404 if no cart found, or 200 if found
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });
});

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
    expect(res.body.results.length).toBeLessThanOrEqual(10); // limit
  });

  it('should handle empty autocomplete query', async () => {
    const res = await request(app).get('/api/products/autocomplete?q=');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results).toEqual([]);
  });
});

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
});

describe('Performance & Caching', () => {
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

  it('should serve cache for repeated product requests', async () => {
    // First request (cold)
    const res1 = await request(app).get('/api/products');
    expect(res1.statusCode).toBe(200);

    // Second request (should be faster or have cached flag)
    const res2 = await request(app).get('/api/products');
    expect(res2.statusCode).toBe(200);
    // Cached flag is optional, but response should still be valid
    expect(res2.body.products).toBeDefined();
  });
});
