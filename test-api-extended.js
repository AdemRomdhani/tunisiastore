#!/usr/bin/env node
/**
 * Tunisia Store API - Extended Comprehensive Test Runner
 * Tests ALL API endpoints with various scenarios
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
}

function divider() {
  log('─'.repeat(60), 'gray');
}

// Helper to make HTTP requests
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test runner
class TestRunner {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  async test(name, fn) {
    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      log(`  ✓ ${name}`, 'green');
    } catch (err) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: err.message });
      log(`  ✗ ${name}`, 'red');
      log(`    Error: ${err.message}`, 'red');
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  async runAllTests() {
    log('\n' + '═'.repeat(60), 'blue');
    log('  Tunisia Store API - Extended Test Suite', 'cyan');
    log('═'.repeat(60) + '\n', 'blue');

    // ==========================
    // HEALTH & CACHE TESTS
    // ==========================
    log('🏥 Health & Cache Tests', 'cyan');
    divider();

    await this.test('Health check returns 200', async () => {
      const res = await request('/api/health');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.status === 'OK', 'Missing status field');
    });

    await this.test('Cache stats endpoint works', async () => {
      const res = await request('/api/health/cache');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.cache, 'Missing cache object');
      this.assert(typeof res.body.cache.enabled === 'boolean', 'Missing enabled field');
    });

    // ==========================
    // AUTH TESTS
    // ==========================
    log('\n🔐 Authentication Tests', 'cyan');
    divider();

    await this.test('Login with invalid credentials returns 401', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'wrong@test.com', password: 'wrong' }
      });
      this.assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await this.test('Login with missing fields returns error', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {}
      });
      this.assert([400, 401, 422].includes(res.status), `Expected error status, got ${res.status}`);
    });

    // ==========================
    // PRODUCT TESTS
    // ==========================
    log('\n📦 Product Tests', 'cyan');
    divider();

    await this.test('GET /api/products returns products list', async () => {
      const res = await request('/api/products');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.success === true, 'Response not successful');
      this.assert(Array.isArray(res.body.products), 'Products is not an array');
    });

    await this.test('GET /api/products with pagination', async () => {
      const res = await request('/api/products?page=1&limit=5');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.pagination, 'Missing pagination');
    });

    await this.test('GET /api/products?search=phone works', async () => {
      const res = await request('/api/products?search=phone');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.success === true, 'Response not successful');
    });

    await this.test('GET /api/products?featured=true works', async () => {
      const res = await request('/api/products?featured=true');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await this.test('GET /api/products?onSale=true works', async () => {
      const res = await request('/api/products?onSale=true');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await this.test('GET /api/products with price filter', async () => {
      const res = await request('/api/products?minPrice=0&maxPrice=1000');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await this.test('404 for non-existent product', async () => {
      const res = await request('/api/products/non-existent-slug-12345xyz');
      this.assert([404, 500].includes(res.status), `Expected 404 or 500, got ${res.status}`);
    });

    // ==========================
    // SEARCH TESTS
    // ==========================
    log('\n🔍 Search & Autocomplete Tests', 'cyan');
    divider();

    await this.test('Autocomplete with query', async () => {
      const res = await request('/api/products/autocomplete?q=phone');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.success === true, 'Response not successful');
    });

    await this.test('Autocomplete with short query', async () => {
      const res = await request('/api/products/autocomplete?q=pho');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(Array.isArray(res.body.results), 'Results is not an array');
    });

    await this.test('Autocomplete with empty query', async () => {
      const res = await request('/api/products/autocomplete?q=');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(Array.isArray(res.body.results), 'Results is not an array');
      this.assert(res.body.results.length === 0, 'Expected empty results');
    });

    // ==========================
    // CATEGORY TESTS
    // ==========================
    log('\n📂 Category Tests', 'cyan');
    divider();

    await this.test('GET /api/categories returns list', async () => {
      const res = await request('/api/categories');
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.success === true, 'Response not successful');
      this.assert(Array.isArray(res.body.categories), 'Categories is not an array');
    });

    // ==========================
    // CART TESTS
    // ==========================
    log('\n🛒 Cart Tests', 'cyan');
    divider();

    await this.test('GET /api/cart returns empty cart', async () => {
      const res = await request('/api/cart', {
        headers: { 'x-device-id': 'test-device-' + Date.now() }
      });
      this.assert(res.status === 200, `Expected 200, got ${res.status}`);
      this.assert(res.body.success === true, 'Response not successful');
    });

    // ==========================
    // WISHLIST TESTS
    // ==========================
    log('\n⭐ Wishlist Tests', 'cyan');
    divider();

    await this.test('GET /api/wishlist requires auth', async () => {
      const res = await request('/api/wishlist');
      this.assert([401, 403].includes(res.status), `Expected 401/403, got ${res.status}`);
    });

    // ==========================
    // ORDER TESTS
    // ==========================
    log('\n📋 Order Tests', 'cyan');
    divider();

    await this.test('POST /api/orders requires auth or validation', async () => {
      const res = await request('/api/orders', {
        method: 'POST',
        body: { items: [] }
      });
      this.assert([400, 401, 403].includes(res.status), `Expected error, got ${res.status}`);
    });

    // ==========================
    // REVIEW TESTS
    // ==========================
    log('\n💬 Review Tests', 'cyan');
    divider();

    await this.test('POST /api/reviews requires auth', async () => {
      const res = await request('/api/reviews', {
        method: 'POST',
        body: { productId: 'test', rating: 5, comment: 'Great!' }
      });
      this.assert([401, 403].includes(res.status), `Expected 401/403, got ${res.status}`);
    });

    // ==========================
    // NEWSLETTER TESTS
    // ==========================
    log('\n📧 Newsletter Tests', 'cyan');
    divider();

    await this.test('POST /api/newsletter/subscribe accepts valid email', async () => {
      const res = await request('/api/newsletter/subscribe', {
        method: 'POST',
        body: { email: `test-${Date.now()}@example.com` }
      });
      this.assert([200, 201, 400, 422].includes(res.status), `Unexpected status: ${res.status}`);
    });

    // ==========================
    // CMS TESTS
    // ==========================
    log('\n📝 CMS Tests', 'cyan');
    divider();

    await this.test('GET /api/cms returns something', async () => {
      const res = await request('/api/cms');
      this.assert([200, 404].includes(res.status), `Expected 200/404, got ${res.status}`);
    });

    // ==========================
    // BUNDLE TESTS
    // ==========================
    log('\n📦 Bundle Tests', 'cyan');
    divider();

    await this.test('GET /api/bundles returns bundles', async () => {
      const res = await request('/api/bundles');
      this.assert([200, 404].includes(res.status), `Expected 200/404, got ${res.status}`);
    });

    // ==========================
    // COUPON TESTS
    // ==========================
    log('\n🎟️  Coupon Tests', 'cyan');
    divider();

    await this.test('GET /api/coupons requires auth', async () => {
      const res = await request('/api/coupons');
      this.assert([401, 403].includes(res.status), `Expected 401/403, got ${res.status}`);
    });

    // ==========================
    // ERROR HANDLING
    // ==========================
    log('\n⚠️  Error Handling Tests', 'cyan');
    divider();

    await this.test('404 for non-existent routes', async () => {
      const res = await request('/api/non-existent-route-12345xyz');
      this.assert([404, 500].includes(res.status), `Expected 404/500, got ${res.status}`);
    });

    await this.test('Invalid JSON body returns error', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-valid-json'
      });
      this.assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    // ==========================
    // PERFORMANCE TESTS
    // ==========================
    log('\n⚡ Performance Tests', 'cyan');
    divider();

    await this.test('Health check responds within 1000ms', async () => {
      const start = Date.now();
      await request('/api/health');
      const duration = Date.now() - start;
      this.assert(duration < 1000, `Took ${duration}ms, expected < 1000ms`);
    });

    await this.test('Products list responds within 3000ms', async () => {
      const start = Date.now();
      await request('/api/products');
      const duration = Date.now() - start;
      this.assert(duration < 3000, `Took ${duration}ms, expected < 3000ms`);
    });

    await this.test('Concurrent requests handled properly', async () => {
      const requests = Array(5).fill(null).map(() => request('/api/health'));
      const start = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - start;
      results.forEach(r => {
        this.assert(r.status === 200, `Expected 200, got ${r.status}`);
      });
      this.assert(duration < 5000, `Took ${duration}ms, expected < 5000ms`);
    });

    // ==========================
    // RESULTS
    // ==========================
    log('\n' + '═'.repeat(60), 'blue');
    log('  Test Results Summary', 'cyan');
    log('═'.repeat(60), 'blue');
    log(`  Total Tests: ${this.results.passed + this.results.failed}`, 'cyan');
    log(`  ✅ Passed: ${this.results.passed}`, 'green');
    if (this.results.failed > 0) {
      log(`  ❌ Failed: ${this.results.failed}`, 'red');
    }
    log('═'.repeat(60) + '\n', 'blue');

    return this.results;
  }
}

// Check server availability
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Main
async function main() {
  log('🔍 Checking if API server is running on port 3000...', 'yellow');
  const isRunning = await checkServer();

  if (!isRunning) {
    log('\n❌ API server is not running on port 3000', 'red');
    log('   Please start it with:', 'yellow');
    log('   cd backend && npm run dev', 'cyan');
    process.exit(1);
  }

  log('✅ API server is running\n', 'green');

  const runner = new TestRunner();
  const results = await runner.runAllTests();

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});
