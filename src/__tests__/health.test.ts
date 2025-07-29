// ============================================================================
// HEALTH SERVICE TESTS - Critical Paths Only
// ============================================================================
// Focused tests for essential health monitoring functionality
// Covers: basic health checks, error handling, status reporting

import { HealthService } from '@/lib/services/health';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn()
  }
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    models: {
      list: jest.fn()
    }
  }))
}));

jest.mock('@/lib/services/cache', () => ({
  agentCache: {
    getStats: jest.fn()
  }
}));

describe('Health Service - Critical Paths', () => {
  let healthService: HealthService;
  let mockPrisma: any;
  let mockOpenAI: any;
  let mockCache: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    healthService = new HealthService();
    
    // Get mocked dependencies
    mockPrisma = require('@/lib/prisma').prisma;
    mockOpenAI = require('openai').OpenAI;
    mockCache = require('@/lib/services/cache').agentCache;
    
    // Reset mock implementations
    mockPrisma.$queryRaw.mockReset();
    mockCache.getStats.mockReset();
    
    // Set default successful responses
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    mockOpenAI.mockImplementation(() => ({
      models: {
        list: jest.fn().mockResolvedValue([])
      }
    }));
    mockCache.getStats.mockReturnValue({ size: 10, maxSize: 1000 });
  });

  describe('System Health Check', () => {
    it('should return healthy status when all services are working', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockResolvedValue([])
        }
      }));
      mockCache.getStats.mockReturnValue({ size: 10, maxSize: 1000 });

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.overall).toBe('healthy');
      expect(healthStatus.checks.database).toBe('healthy');
      expect(healthStatus.checks.openai).toBe('healthy');
      expect(healthStatus.checks.cache).toBe('healthy');
      expect(healthStatus.timestamp).toBeDefined();
      expect(healthStatus.responseTime).toBeGreaterThan(0);
    });

    it('should return degraded status when some services are failing', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]); // DB OK
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      })); // OpenAI failing
      mockCache.getStats.mockReturnValue({ size: 10, maxSize: 1000 }); // Cache OK

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.overall).toBe('degraded');
      expect(healthStatus.checks.database).toBe('healthy');
      expect(healthStatus.checks.openai).toBe('unhealthy');
      expect(healthStatus.checks.cache).toBe('healthy');
    });

    it('should return unhealthy status when all services are failing', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }));
      mockCache.getStats.mockImplementation(() => {
        throw new Error('Cache Error');
      });

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.overall).toBe('unhealthy');
      expect(healthStatus.checks.database).toBe('unhealthy');
      expect(healthStatus.checks.openai).toBe('unhealthy');
      expect(healthStatus.checks.cache).toBe('unhealthy');
    });

    it('should handle database connection failures', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.checks.database).toBe('unhealthy');
      expect(healthStatus.overall).toBe('degraded');
    });

    it('should handle OpenAI API failures', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockRejectedValue(new Error('Rate limit exceeded'))
        }
      }));
      mockCache.getStats.mockReturnValue({ size: 10, maxSize: 1000 });

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.checks.openai).toBe('unhealthy');
      expect(healthStatus.overall).toBe('degraded');
    });

    it('should handle cache service failures', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockResolvedValue([])
        }
      }));
      mockCache.getStats.mockImplementation(() => {
        throw new Error('Cache unavailable');
      });

      // Act
      const healthStatus = await healthService.checkSystemHealth();

      // Assert
      expect(healthStatus.checks.cache).toBe('unhealthy');
      expect(healthStatus.overall).toBe('degraded');
    });
  });

  describe('Detailed Health Check', () => {
    it('should provide detailed health information', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockResolvedValue([])
        }
      }));
      mockCache.getStats.mockReturnValue({ 
        size: 15, 
        maxSize: 1000, 
        hitRate: 0.85 
      });

      // Act
      const detailedHealth = await healthService.getDetailedHealth();

      // Assert
      expect(detailedHealth.overall).toBe('healthy');
      expect(detailedHealth.details.database.status).toBe('healthy');
      expect(detailedHealth.details.openai.status).toBe('healthy');
      expect(detailedHealth.details.cache.status).toBe('healthy');
      expect(detailedHealth.details.cache.stats.size).toBe(15);
      expect(detailedHealth.details.cache.stats.hitRate).toBe(0.85);
      expect(detailedHealth.responseTime).toBeGreaterThan(0);
    });

    it('should include timestamps in detailed health', async () => {
      // Arrange
      mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockResolvedValue([])
        }
      }));
      mockCache.getStats.mockReturnValue({ size: 10, maxSize: 1000 });

      // Act
      const detailedHealth = await healthService.getDetailedHealth();

      // Assert
      expect(detailedHealth.details.database.timestamp).toBeDefined();
      expect(detailedHealth.details.openai.timestamp).toBeDefined();
      expect(detailedHealth.details.cache.timestamp).toBeDefined();
      expect(new Date(detailedHealth.details.database.timestamp)).toBeInstanceOf(Date);
    });
  });
}); 