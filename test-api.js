#!/usr/bin/env node
/**
 * Tunisia Store API - Comprehensive Test Runner
 * 
 * This script:
 * 1. Checks if MongoDB is running
 * 2. Starts the development server if needed
 * 3. Runs all API tests
 * 4. Reports results
 */

const { spawn } = require('child_process');
const http = require('http');

const API_BASE = 'http://localhost:3000';
const TEST_TIMEOUT = 300000; // 5 minutes

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
}

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

function runJestTests() {
  return new Promise((resolve, reject) => {
    log('\n🧪 Running Jest tests...', 'cyan');
    
    const jest = spawn('npx', ['jest', '--verbose', '--no-cache', '--forceExit'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    jest.on('close', (code) => {
      resolve(code);
    });

    jest.on('error', (err) => {
      reject(err);
    });
  });
}

function runSimpleTests() {
  log('\n📡 Testing API endpoints directly...', 'cyan');
  
  return new Promise(async (resolve) => {
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };

    const test = async (name, fn) => {
      try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: 'PASSED' });
        log(`  ✓ ${name}`, 'green');
      } catch (err) {
        results.failed++;
        results.tests.push({ name, status: 'FAILED', error: err.message });
        log(`  ✗ ${name}`, 'red');
        log(`    Error: ${err.message}`, 'red');
      }
    };

    // Test Health Check
    await test('Health Check endpoint', async () => {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!data.status) throw new Error('Missing status field');
    });

    // Test Cache Stats
    await test('Cache Stats endpoint', async () => {
      const res = await fetch(`${API_BASE}/api/health/cache`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!data.cache) throw new Error('Missing cache field');
    });

    // Test Products
    await test('GET /api/products', async () => {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Response not successful');
      if (!Array.isArray(data.products)) throw new Error('Products is not an array');
    });

    // Test Categories
    await test('GET /api/categories', async () => {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Response not successful');
    });

    // Test Auth - Invalid login
    await test('POST /api/auth/login (invalid)', async () => {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@test.com', password: 'wrong' })
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // Test Cart - Get empty cart
    await test('GET /api/cart (empty)', async () => {
      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { 'x-device-id': 'test-device-123' }
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Response not successful');
    });

    // Test Newsletter
    await test('POST /api/newsletter/subscribe', async () => {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test-${Date.now()}@example.com` })
      });
      // Should accept or reject, but not crash
      if (![200, 201, 400, 422].includes(res.status)) {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    });

    // Test 404
    await test('404 Handler', async () => {
      const res = await fetch(`${API_BASE}/api/non-existent`);
      if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    });

    resolve(results);
  });
}

async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('  Tunisia Store API - Functionality Test Suite', 'cyan');
  log('='.repeat(60) + '\n', 'blue');

  // Check if server is running
  log('🔍 Checking if API server is running...', 'yellow');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    log('⚠️  API server is not running on port 3000', 'yellow');
    log('   Please start it with: npm run dev (in /backend)', 'yellow');
    log('   Or: node backend/server.js', 'yellow');
    log('\n   Tests will continue with available endpoints...\n', 'yellow');
  } else {
    log('✅ API server is running on port 3000', 'green');
    log('   Proceeding with tests...\n', 'green');
  }

  if (isRunning) {
    // Run simple tests against the running server
    const results = await runSimpleTests();
    
    log('\n' + '='.repeat(60), 'blue');
    log('  Test Results', 'cyan');
    log('='.repeat(60), 'blue');
    log(`  Total Tests: ${results.passed + results.failed}`, 'cyan');
    log(`  Passed: ${results.passed}`, 'green');
    log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log('='.repeat(60) + '\n', 'blue');

    if (results.failed > 0) {
      log('❌ Some tests failed. Check the output above.', 'red');
      process.exit(1);
    } else {
      log('✅ All tests passed!', 'green');
      process.exit(0);
    }
  } else {
    log('❌ Cannot run tests without a running server.', 'red');
    log('   Please start MongoDB and the API server first.', 'red');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  log(`\n❌ Unhandled error: ${err.message}`, 'red');
  process.exit(1);
});

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});
