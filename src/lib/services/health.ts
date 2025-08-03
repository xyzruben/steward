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

// ============================================================================
// CRITICAL FIX #1: SAFE AUDIT FUNCTION
// ============================================================================
// Prevents methodology from failing completely when audits fail

export async function safeAudit(auditFunction: Function, auditName: string = 'Unknown'): Promise<any> {
  try {
    console.log(`🔍 Starting audit: ${auditName}`);
    const result = await auditFunction();
    console.log(`✅ Audit completed: ${auditName}`);
    return { success: true, data: result };
  } catch (error) {
    console.error(`❌ Audit failed: ${auditName}`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      auditName 
    };
  }
}

// ============================================================================
// CRITICAL FIX #2: ENHANCED DATABASE HEALTH CHECK
// ============================================================================
// Prevents silent failures and provides detailed database status

export async function validateDatabaseHealth(): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    console.log('🔍 Validating database health...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test schema access
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'receipts'
    ` as any[];
    
    if (tables.length === 0) {
      throw new Error('Receipts table not found');
    }
    
    // Test basic query
    const receiptCount = await prisma.receipt.count();
    
    console.log('✅ Database health check passed');
    return { 
      success: true, 
      details: { 
        connection: 'healthy',
        schema: 'valid',
        receiptCount 
      } 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ Database health check failed:', errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
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