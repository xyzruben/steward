// ============================================================================
// SIMPLE HEALTH CHECK SERVICE - AI-First Architecture
// ============================================================================
// Basic health monitoring for core system components
// Focuses on essential services without complex monitoring overhead

import { prisma } from '../prisma';
import { OpenAI } from 'openai';
import { agentCache } from './cache';

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: 'healthy' | 'unhealthy';
    openai: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
  timestamp: string;
  responseTime: number;
}

export class HealthService {
  async checkSystemHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkOpenAI(),
      this.checkCache()
    ]);

    const responseTime = Date.now() - startTime;

    const status: HealthStatus = {
      overall: 'healthy',
      checks: {
        database: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        openai: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
        cache: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy'
      },
      timestamp: new Date().toISOString(),
      responseTime
    };

    // Determine overall status
    const unhealthyChecks = Object.values(status.checks).filter(check => check === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      status.overall = unhealthyChecks.length === Object.keys(status.checks).length ? 'unhealthy' : 'degraded';
    }

    return status;
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkOpenAI(): Promise<boolean> {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      await openai.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      // Simple cache health check
      const stats = agentCache.getStats();
      return stats.size >= 0; // Basic check that cache is accessible
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }

  async getDetailedHealth(): Promise<HealthStatus & { details: Record<string, any> }> {
    const basicHealth = await this.checkSystemHealth();
    
    const details = {
      database: {
        status: basicHealth.checks.database,
        timestamp: basicHealth.timestamp
      },
      openai: {
        status: basicHealth.checks.openai,
        timestamp: basicHealth.timestamp
      },
      cache: {
        status: basicHealth.checks.cache,
        stats: agentCache.getStats(),
        timestamp: basicHealth.timestamp
      }
    };

    return {
      ...basicHealth,
      details
    };
  }
}

// Global health service instance
export const healthService = new HealthService(); 