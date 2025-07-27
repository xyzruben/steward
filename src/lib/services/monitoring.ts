// ============================================================================
// MONITORING SERVICE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Monitoring and Observability)
// ============================================================================
// Simplified monitoring service without database dependencies
// Follows master guide: Monitoring and Observability, Error Handling

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
// MONITORING SERVICE
// ============================================================================

export class MonitoringService {
  private static instance: MonitoringService;
  private performanceBuffer: PerformanceMetrics[] = [];
  private errorBuffer: ErrorReport[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    // Set up periodic buffer flushing
    setInterval(() => {
      this.flushBuffers();
    }, this.FLUSH_INTERVAL);
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // ============================================================================
  // LOGGING METHODS
  // ============================================================================

  /**
   * Log agent query with performance metrics
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
      metadata: metadata || {},
    };

    // Console logging for now (database logging commented out until models are added)
    console.log('Agent Query Log:', logEntry);

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

    // Console logging for now (database logging commented out until models are added)
    console.error('Agent Error:', errorReport);

    // Add to error buffer
    this.errorBuffer.push(errorReport);

    // Send alert for critical errors
    if (errorReport.severity === 'critical') {
      await this.sendAlert(errorReport);
    }
  }

  /**
   * Determine error severity based on error message
   */
  private determineSeverity(error: string): 'low' | 'medium' | 'high' | 'critical' {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('timeout') || errorLower.includes('connection failed')) {
      return 'high';
    }
    
    if (errorLower.includes('unauthorized') || errorLower.includes('permission denied')) {
      return 'critical';
    }
    
    if (errorLower.includes('validation') || errorLower.includes('invalid input')) {
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
    // Simplified metrics without database queries (commented out until models are added to schema)
    console.log('Getting agent metrics for time range:', timeRange);
    
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      topQueries: [],
      functionUsage: {},
      errorBreakdown: {},
      userEngagement: {
        activeUsers: 0,
        averageQueriesPerUser: 0,
        retentionRate: 0,
      },
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
   * Clear old logs and errors (simplified stub)
   */
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    console.log(`Cleaning up data older than ${retentionDays} days`);
    // Database cleanup commented out until models are added
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    cache: boolean;
    lastError?: string;
  }> {
    return {
      status: 'healthy',
      database: true, // Simplified for now
      cache: true,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return analyticsCache.getStats();
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    // Simplified stub (cache invalidation commented out until cache service is updated)
    console.log(`Invalidating cache for user: ${userId}`);
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance(); 