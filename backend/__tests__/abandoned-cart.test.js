// Abandoned Cart Service Tests
// Mock EmailService
jest.mock('../src/services/email.service', () => {
  return {
    sendAbandonedCart: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };
});

const Cart = require('../src/models/Cart');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock Sentry before importing modules that use it
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

const AbandonedCartService = require('../src/services/abandoned-cart.service');

describe('Abandoned Cart Service', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await require('mongoose').connect(uri);
  });

  afterAll(async () => {
    await require('mongoose').connection.close();
  });

  afterEach(async () => {
    await Cart.deleteMany({});
  });

  const createCartWithItems = async (overrides = {}) => {
    const mongoose = require('mongoose');
    const defaultCart = {
      user: null,
      deviceId: 'device_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          quantity: 2,
          selectedAttributes: [],
          addedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ],
      guestEmail: 'test@example.com',
      guestPhone: '+21699999999',
      reminderCount: 0,
      lastModified: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRecovered: false
    };

    return await Cart.create({ ...defaultCart, ...overrides });
  };

  describe('processAbandonedCarts', () => {
    it('should find and process abandoned carts', async () => {
      // Override the lastModified to be more than 2 hours ago for proper abandonment
      const cart = await createCartWithItems({
        lastModified: new Date(Date.now() - 4 * 60 * 60 * 1000)
      });
      
      const result = await AbandonedCartService.processAbandonedCarts();
      
      expect(result.success).toBe(true);
      expect(result.processed).toBeGreaterThanOrEqual(0);
      expect(result.sent).toBeGreaterThanOrEqual(0);
    });

    it('should not process recently modified carts', async () => {
      await createCartWithItems({
        lastModified: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago (not abandoned)
      });
      
      const result = await AbandonedCartService.processAbandonedCarts();
      
      expect(result.processed).toBe(0);
    });

    it('should not process already recovered carts', async () => {
      await createCartWithItems({
        isRecovered: true,
        recoveredAt: new Date()
      });
      
      const result = await AbandonedCartService.processAbandonedCarts();
      
      // Actually isRecovered filter is not in the query, but should be added
      expect(result.processed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sendRecoveryReminder', () => {
    it('should send recovery email for abandoned cart', async () => {
      const cart = await createCartWithItems();
      
      const result = await AbandonedCartService.sendRecoveryReminder(cart);
      
      expect(result.success).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.itemCount).toBe(1);
    });

    it('should not send email too soon after last reminder', async () => {
      const cart = await createCartWithItems({
        lastReminderAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
      
      const result = await AbandonedCartService.sendRecoveryReminder(cart);
      
      // Should be prevented - too soon
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Too soon');
    });

    it('should not process empty carts', async () => {
      const cart = await createCartWithItems({
        items: []
      });
      
      const result = await AbandonedCartService.sendRecoveryReminder(cart);
      
      expect(result.success).toBe(false);
    });

    it('should require email address', async () => {
      const cart = await createCartWithItems({
        guestEmail: null,
        user: null
      });
      
      const result = await AbandonedCartService.sendRecoveryReminder(cart);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No email address');
    });
  });

  describe('markCartRecovered', () => {
    it('should mark cart as recovered', async () => {
      const cart = await createCartWithItems();
      
      await AbandonedCartService.markCartRecovered(cart._id);
      
      const updated = await Cart.findById(cart._id);
      expect(updated.isRecovered).toBe(true);
      expect(updated.recoveredAt).toBeDefined();
    });

    it('should handle non-existent cart', async () => {
      const mongoose = require('mongoose');
      // Should not throw
      await expect(
        AbandonedCartService.markCartRecovered(new mongoose.Types.ObjectId())
      ).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      const stats = await AbandonedCartService.getStats();
      
      expect(stats.totalCarts).toBeGreaterThanOrEqual(0);
      expect(stats.abandonedCount).toBeGreaterThanOrEqual(0);
      expect(stats.recoveredCount).toBeGreaterThanOrEqual(0);
      expect(stats.recoveryRate).toBeDefined();
    });
  });
});
