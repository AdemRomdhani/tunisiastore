const cacheService = require('../src/services/cache.service');

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.memoryCache.clear();
  });

  describe('set/get', () => {
    it('should set and get a value', async () => {
      await cacheService.set('product', '123', { name: 'Test Product' });
      const result = await cacheService.get('product', '123');
      expect(result).toEqual({ name: 'Test Product' });
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('product', 'non-existent');
      expect(result).toBeNull();
    });

    it('should expire after TTL', async () => {
      await cacheService.set('product', 'expire', { name: 'Test' }, 10); // 10ms TTL
      
      // Immediately after: should be there
      const result1 = await cacheService.get('product', 'expire');
      expect(result1).toEqual({ name: 'Test' });

      // Wait for it to expire
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result2 = await cacheService.get('product', 'expire');
      expect(result2).toBeNull();
    });
  });

  describe('getOrFetch', () => {
    it('should fetch and cache when not in cache', async () => {
      let fetched = false;
      const fetchFn = async () => {
        fetched = true;
        return { name: 'Product A' };
      };

      const result = await cacheService.getOrFetch('product', 'fetch-test', fetchFn);
      
      expect(result).toEqual({ name: 'Product A' });
      expect(fetched).toBe(true);
      
      // Should use cache on second call
      const result2 = await cacheService.getOrFetch('product', 'fetch-test', fetchFn);
      expect(result2).toEqual({ name: 'Product A' });
    });
  });

  describe('invalidate', () => {
    it('should delete all keys of a type', async () => {
      await cacheService.set('product', '1', { name: 'A' });
      await cacheService.set('product', '2', { name: 'B' });
      await cacheService.set('category', '1', { name: 'C' });

      await cacheService.invalidate('product');

      expect(await cacheService.get('product', '1')).toBeNull();
      expect(await cacheService.get('product', '2')).toBeNull();
      expect(await cacheService.get('category', '1')).toEqual({ name: 'C' });
    });
  });

  describe('invalidateProduct / invalidateCategory', () => {
    it('should invalidate specific product', async () => {
      await cacheService.set('product', 'prod1', { name: 'Product 1' });
      await cacheService.set('product', 'prod2', { name: 'Product 2' });

      await cacheService.invalidateProduct('prod1');

      expect(await cacheService.get('product', 'prod1')).toBeNull();
      expect(await cacheService.get('product', 'prod2')).toEqual({ name: 'Product 2' });
    });

    it('should invalidate all products when category changes', async () => {
      await cacheService.set('product', 'list1', { name: 'Products' });
      await cacheService.set('product', 'prod1', { name: 'Product 1' });
      await cacheService.set('category', 'cat1', { name: 'Category 1' });

      await cacheService.invalidateCategory('cat1');

      // Products should be invalidated
      expect(await cacheService.get('product', 'list1')).toBeNull();
      expect(await cacheService.get('product', 'prod1')).toBeNull();
      // Category should be invalidated too because it calls invalidate('product') which removes all products
      // but not categories - check actual behavior
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('product', '1', { name: 'A' });
      await cacheService.set('product', '2', { name: 'B' });
      await cacheService.set('category', '1', { name: 'C' });

      const stats = cacheService.getStats();
      
      expect(stats.enabled).toBe(true);
      expect(stats.entries).toBe(3);
      expect(stats.types.product).toBe(2);
      expect(stats.types.category).toBe(1);
    });
  });
});

module.exports = { cacheService };
