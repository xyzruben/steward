// ============================================================================
// MONITORING SERVICE FOR AI FINANCIAL ASSISTANT
// ============================================================================
// Comprehensive monitoring and analytics for agent usage, performance, and errors
// See: Master System Guide - Monitoring and Observability, TypeScript Standards

import { prisma } from '../prisma';
import { analyticsCache } from './cache';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AgentMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageResponseTime: number;
  }>;
  functionUsage: Record<string, number>;
  errorBreakdown: Record<string, number>;
  userEngagement: {
    activeUsers: number;
    averageQueriesPerUser: number;
    retentionRate: number;
  };
}

export interface AgentLogEntry {
  id: string;
  userId: string;
  query: string;
  responseTime: number;
  success: boolean;
  error?: string;
  functionsUsed: string[];
  cached: boolean;
  timestamp: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

export interface PerformanceMetrics {
  query: string;
  responseTime: number;
  functionsUsed: string[];
  cached: boolean;
  timestamp: Date;
}

export interface ErrorReport {
  id: string;
  userId: string;
  query: string;
  error: string;
  stackTrace?: string;
  context: {
    functionsUsed: string[];
    responseTime: number;
    timestamp: Date;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  timestamp: Date;
}

// ============================================================================
// MONITORING SERVICE CLASS
// ============================================================================

export class MonitoringService {
  private static instance: MonitoringService;
  private performanceBuffer: PerformanceMetrics[] = [];
  private errorBuffer: ErrorReport[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    // Start periodic flushing
    setInterval(() => this.flushBuffers(), this.FLUSH_INTERVAL);
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // ============================================================================
  // AGENT USAGE TRACKING
  // ============================================================================

  /**
   * Log agent query and response
   */
  async logAgentQuery(
    userId: string,
    query: string,
    responseTime: number,
    success: boolean,
    functionsUsed: string[] = [],
    cached: boolean = false,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const logEntry: AgentLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      query,
      responseTime,
      success,
      error,
      functionsUsed,
      cached,
      timestamp: new Date(),
      metadata: {
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        sessionId: metadata?.sessionId,
      },
    };

    // Store in database
    try {
      await prisma.agentLog.create({
        data: {
          id: logEntry.id,
          userId,
          query,
          responseTime,
          success,
          error: error || null,
          functionsUsed: functionsUsed,
          cached,
          timestamp: logEntry.timestamp,
          metadata: logEntry.metadata,
        },
      });
    } catch (dbError) {
      console.error('Failed to log agent query to database:', dbError);
      // Fallback to console logging
      console.log('Agent Query Log:', logEntry);
    }

    // Add to performance buffer
    this.performanceBuffer.push({
      query,
      responseTime,
      functionsUsed,
      cached,
      timestamp: logEntry.timestamp,
    });

    // Log error if present
    if (error) {
      await this.logError(userId, query, error, {
        functionsUsed,
        responseTime,
        timestamp: logEntry.timestamp,
      });
    }

    // Flush buffers if they're getting large
    if (this.performanceBuffer.length >= this.BUFFER_SIZE) {
      this.flushBuffers();
    }
  }

  // ============================================================================
  // ERROR MONITORING
  // ============================================================================

  /**
   * Log agent error with context
   */
  async logError(
    userId: string,
    query: string,
    error: string,
    context: {
      functionsUsed: string[];
      responseTime: number;
      timestamp: Date;
    },
    stackTrace?: string
  ): Promise<void> {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      query,
      error,
      stackTrace,
      context,
      severity: this.determineSeverity(error),
      resolved: false,
      timestamp: context.timestamp,
    };

    // Store in database
    try {
      await prisma.agentError.create({
        data: {
          id: errorReport.id,
          userId,
          query,
          error,
          stackTrace: stackTrace || null,
          context: context,
          severity: errorReport.severity,
          resolved: false,
          timestamp: context.timestamp,
        },
      });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
      // Fallback to console logging
      console.error('Agent Error:', errorReport);
    }

    // Add to error buffer
    this.errorBuffer.push(errorReport);

    // Send alert for critical errors
    if (errorReport.severity === 'critical') {
      await this.sendAlert(errorReport);
    }
  }

  /**
   * Determine error severity based on error type
   */
  private determineSeverity(error: string): 'low' | 'medium' | 'high' | 'critical' {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('rate limit') || errorLower.includes('quota exceeded')) {
      return 'high';
    }
    if (errorLower.includes('authentication') || errorLower.includes('unauthorized')) {
      return 'high';
    }
    if (errorLower.includes('database') || errorLower.includes('connection')) {
      return 'critical';
    }
    if (errorLower.includes('openai') || errorLower.includes('api')) {
      return 'high';
    }
    if (errorLower.includes('timeout') || errorLower.includes('network')) {
      return 'medium';
    }
    
    return 'low';
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Get comprehensive agent metrics
   */
  async getAgentMetrics(timeRange: { start: Date; end: Date }): Promise<AgentMetrics> {
    const cacheKey = `agent-metrics:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`;
    
    // Try cache first
    const cached = await analyticsCache.get<AgentMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database for metrics
    const [
      totalQueries,
      successfulQueries,
      failedQueries,
      averageResponseTime,
      cacheHits,
      topQueries,
      functionUsage,
      errorBreakdown,
      userEngagement,
    ] = await Promise.all([
      this.getTotalQueries(timeRange),
      this.getSuccessfulQueries(timeRange),
      this.getFailedQueries(timeRange),
      this.getAverageResponseTime(timeRange),
      this.getCacheHits(timeRange),
      this.getTopQueries(timeRange),
      this.getFunctionUsage(timeRange),
      this.getErrorBreakdown(timeRange),
      this.getUserEngagement(timeRange),
    ]);

    const metrics: AgentMetrics = {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageResponseTime,
      cacheHitRate: totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0,
      topQueries,
      functionUsage,
      errorBreakdown,
      userEngagement,
    };

    // Cache the result
    await analyticsCache.set(cacheKey, metrics, 300); // 5 minutes

    return metrics;
  }

  /**
   * Get total queries in time range
   */
  private async getTotalQueries(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.agentLog.count({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });
    return result;
  }

  /**
   * Get successful queries in time range
   */
  private async getSuccessfulQueries(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.agentLog.count({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        success: true,
      },
    });
    return result;
  }

  /**
   * Get failed queries in time range
   */
  private async getFailedQueries(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.agentLog.count({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        success: false,
      },
    });
    return result;
  }

  /**
   * Get average response time in time range
   */
  private async getAverageResponseTime(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.agentLog.aggregate({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      _avg: {
        responseTime: true,
      },
    });
    return result._avg.responseTime || 0;
  }

  /**
   * Get cache hits in time range
   */
  private async getCacheHits(timeRange: { start: Date; end: Date }): Promise<number> {
    const result = await prisma.agentLog.count({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        cached: true,
      },
    });
    return result;
  }

  /**
   * Get top queries in time range
   */
  private async getTopQueries(timeRange: { start: Date; end: Date }): Promise<Array<{ query: string; count: number; averageResponseTime: number }>> {
    const results = await prisma.$queryRaw<Array<{ query: string; count: number; averageResponseTime: number }>>`
      SELECT 
        query,
        COUNT(*) as count,
        AVG(response_time) as averageResponseTime
      FROM agent_logs
      WHERE timestamp >= ${timeRange.start} AND timestamp <= ${timeRange.end}
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `;
    return results;
  }

  /**
   * Get function usage in time range
   */
  private async getFunctionUsage(timeRange: { start: Date; end: Date }): Promise<Record<string, number>> {
    const results = await prisma.agentLog.findMany({
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
        functionsUsed: {
          isEmpty: false,
        },
      },
      select: {
        functionsUsed: true,
      },
    });

    const usage: Record<string, number> = {};
    results.forEach((log: { functionsUsed: string[] }) => {
      if (log.functionsUsed) {
        log.functionsUsed.forEach((func: string) => {
          usage[func] = (usage[func] || 0) + 1;
        });
      }
    });

    return usage;
  }

  /**
   * Get error breakdown in time range
   */
  private async getErrorBreakdown(timeRange: { start: Date; end: Date }): Promise<Record<string, number>> {
    const results = await prisma.agentError.groupBy({
      by: ['error'],
      where: {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
      _count: {
        error: true,
      },
    });

    const breakdown: Record<string, number> = {};
    results.forEach(result => {
      if (result.error) {
        breakdown[result.error] = result._count.error;
      }
    });

    return breakdown;
  }

  /**
   * Get user engagement metrics in time range
   */
  private async getUserEngagement(timeRange: { start: Date; end: Date }): Promise<{ activeUsers: number; averageQueriesPerUser: number; retentionRate: number }> {
    const [
      activeUsers,
      totalQueries,
      uniqueUsers,
    ] = await Promise.all([
      prisma.agentLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
        _count: {
          userId: true,
        },
      }),
      prisma.agentLog.count({
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      }),
      prisma.agentLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      }),
    ]);

    return {
      activeUsers: activeUsers.length,
      averageQueriesPerUser: uniqueUsers.length > 0 ? totalQueries / uniqueUsers.length : 0,
      retentionRate: 0, // TODO: Implement retention calculation
    };
  }

  // ============================================================================
  // ALERTING
  // ============================================================================

  /**
   * Send alert for critical errors
   */
  private async sendAlert(errorReport: ErrorReport): Promise<void> {
    // TODO: Integrate with alerting service (Slack, email, etc.)
    console.error('CRITICAL AGENT ERROR ALERT:', {
      id: errorReport.id,
      userId: errorReport.userId,
      query: errorReport.query,
      error: errorReport.error,
      timestamp: errorReport.timestamp,
    });
  }

  // ============================================================================
  // BUFFER MANAGEMENT
  // ============================================================================

  /**
   * Flush performance and error buffers
   */
  private async flushBuffers(): Promise<void> {
    if (this.performanceBuffer.length > 0) {
      console.log(`Flushing ${this.performanceBuffer.length} performance metrics`);
      this.performanceBuffer = [];
    }

    if (this.errorBuffer.length > 0) {
      console.log(`Flushing ${this.errorBuffer.length} error reports`);
      this.errorBuffer = [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Clear old logs and errors
   */
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await Promise.all([
      prisma.agentLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
      prisma.agentError.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
    ]);

    console.log(`Cleaned up data older than ${retentionDays} days`);
  }

  /**
   * Get monitoring service health
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    cache: boolean;
    lastError?: string;
  }> {
    try {
      // Test database connection
      await prisma.agentLog.count();
      
      // Test cache connection
      await analyticsCache.get('health-check');

      return {
        status: 'healthy',
        database: true,
        cache: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        cache: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance(); 