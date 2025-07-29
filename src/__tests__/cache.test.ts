// ============================================================================
// CACHE SERVICE TESTS - Critical Paths Only
// ============================================================================
// Focused tests for essential cache functionality
// Covers: basic operations, user isolation, TTL, memory management

import { Cache } from '@/lib/services/cache';

describe('Cache Service - Critical Paths', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  afterEach(() => {
    cache.dispose();
  });

  describe('Basic Operations', () => {
    it('should set and get values correctly', async () => {
      // Arrange
      const key = 'test-key';
      const value = { data: 'test-value', timestamp: Date.now() };

      // Act
      await cache.set(key, value, { ttl: 3600 });
      const result = await cache.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      // Act
      const result = await cache.get('non-existent-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle synchronous set operations', () => {
      // Arrange
      const key = 'sync-test';
      const value = { data: 'sync-value' };

      // Act
      cache.setSync(key, value, 3600);
      const result = cache.get(key);

      // Assert
      expect(result).resolves.toEqual(value);
    });
  });

  describe('User Isolation', () => {
    it('should isolate user data correctly', async () => {
      // Arrange
      const user1Data = { spending: 1000 };
      const user2Data = { spending: 2000 };
      const key = 'spending-data';

      // Act
      await cache.set(key, user1Data, { userId: 'user1', ttl: 3600 });
      await cache.set(key, user2Data, { userId: 'user2', ttl: 3600 });

      const user1Result = await cache.get(key, 'user1');
      const user2Result = await cache.get(key, 'user2');
      const globalResult = await cache.get(key);

      // Assert
      expect(user1Result).toEqual(user1Data);
      expect(user2Result).toEqual(user2Data);
      expect(globalResult).toBeNull(); // No global key set
    });

    it('should clear user-specific cache entries', async () => {
      // Arrange
      await cache.set('key1', 'value1', { userId: 'user1', ttl: 3600 });
      await cache.set('key2', 'value2', { userId: 'user1', ttl: 3600 });
      await cache.set('key3', 'value3', { userId: 'user2', ttl: 3600 });

      // Act
      cache.clearUserSync('user1');

      const user1Key1 = await cache.get('key1', 'user1');
      const user1Key2 = await cache.get('key2', 'user1');
      const user2Key3 = await cache.get('key3', 'user2');

      // Assert
      expect(user1Key1).toBeNull();
      expect(user1Key2).toBeNull();
      expect(user2Key3).toEqual('value3'); // User2 data should remain
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      // Arrange
      const key = 'expiring-key';
      const value = 'expiring-value';
      const shortTtl = 0.1; // 100ms

      // Act
      await cache.set(key, value, { ttl: shortTtl });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = await cache.get(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle different TTL values', async () => {
      // Arrange
      const key1 = 'key1';
      const key2 = 'key2';
      const value = 'test-value';

      // Act
      await cache.set(key1, value, { ttl: 1 }); // 1 second
      cache.setSync(key2, value, 3600); // 1 hour

      const result1 = await cache.get(key1);
      const result2 = await cache.get(key2);

      // Assert
      expect(result1).toEqual(value);
      expect(result2).toEqual(value);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      // Arrange
      await cache.set('key1', 'value1', { ttl: 3600 });
      await cache.set('key2', 'value2', { userId: 'user1', ttl: 3600 });
      await cache.get('key1'); // Hit
      await cache.get('non-existent'); // Miss

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.size).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.userSpecificEntries).toBe(1);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('user1:key2');
    });

    it('should provide cache health status', async () => {
      // Arrange - Add some activity to get a healthy hit rate
      await cache.set('key1', 'value1', { ttl: 3600 });
      await cache.get('key1'); // Hit
      await cache.get('key1'); // Another hit

      // Act
      const health = cache.getHealth();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.hitRate).toBeGreaterThanOrEqual(0);
      expect(health.size).toBeGreaterThanOrEqual(0);
      expect(health.memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });
}); 