// ============================================================================
// PERFORMANCE MONITORING SERVICE
// ============================================================================
// Advanced performance tracking, load testing, and real-time monitoring
// See: Master System Guide - Monitoring and Observability, TypeScript Standards

import { monitoringService } from './monitoring';
import { analyticsCache } from './cache';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  success: boolean;
  error?: string;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    cacheHit?: boolean;
    functionsUsed?: string[];
    responseSize?: number;
    databaseQueries?: number;
    externalApiCalls?: number;
  };
}

export interface LoadTestResult {
  id: string;
  testName: string;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  concurrency: number;
  results: Array<{
    requestId: string;
    duration: number;
    success: boolean;
    error?: string;
    timestamp: Date;
  }>;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'throughput' | 'memory_usage' | 'database_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  context: Record<string, any>;
}

export interface PerformanceDashboard {
  realTime: {
    currentResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeUsers: number;
    cacheHitRate: number;
  };
  historical: {
    responseTimeTrend: Array<{ timestamp: Date; value: number }>;
    throughputTrend: Array<{ timestamp: Date; value: number }>;
    errorRateTrend: Array<{ timestamp: Date; value: number }>;
  };
  alerts: PerformanceAlert[];
  topSlowOperations: Array<{
    operation: string;
    averageDuration: number;
    count: number;
  }>;
  resourceUsage: {
    memoryUsage: number;
    cpuUsage: number;
    databaseConnections: number;
    cacheSize: number;
  };
}

// ============================================================================
// PERFORMANCE MONITORING SERVICE
// ============================================================================

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metricsBuffer: PerformanceMetric[] = [];
  private alertsBuffer: PerformanceAlert[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly ALERT_THRESHOLDS = {
    responseTime: {
      warning: 1000, // 1 second
      critical: 5000, // 5 seconds
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.10, // 10%
    },
    throughput: {
      warning: 10, // 10 requests per second
      critical: 5, // 5 requests per second
    },
  };

  private constructor() {
    // Start periodic flushing
    setInterval(() => this.flushBuffers(), this.FLUSH_INTERVAL);
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  // ============================================================================
  // PERFORMANCE TRACKING
  // ============================================================================

  /**
   * Track a performance metric
   */
  async trackPerformance(
    operation: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>,
    error?: string
  ): Promise<void> {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      operation,
      duration,
      timestamp: new Date(),
      userId,
      success,
      error,
      metadata: {
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        sessionId: metadata?.sessionId,
        cacheHit: metadata?.cacheHit,
        functionsUsed: metadata?.functionsUsed,
        responseSize: metadata?.responseSize,
        databaseQueries: metadata?.databaseQueries,
        externalApiCalls: metadata?.externalApiCalls,
      },
    };

    this.metricsBuffer.push(metric);

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);

    // Flush buffer if it's full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushMetricsBuffer();
    }

    // Also log to monitoring service
    await monitoringService.logAgentQuery(
      userId || 'anonymous',
      operation,
      duration,
      success,
      metadata?.functionsUsed || [],
      metadata?.cacheHit || false,
      error
    );
  }

  /**
   * Track database performance
   */
  async trackDatabasePerformance(
    query: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackPerformance(
      `db:${query}`,
      duration,
      success,
      userId,
      {
        ...metadata,
        databaseQueries: 1,
        operationType: 'database',
      }
    );
  }

  /**
   * Track external API performance
   */
  async trackExternalApiPerformance(
    api: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackPerformance(
      `api:${api}`,
      duration,
      success,
      userId,
      {
        ...metadata,
        externalApiCalls: 1,
        operationType: 'external_api',
      }
    );
  }

  // ============================================================================
  // LOAD TESTING
  // ============================================================================

  /**
   * Run a load test
   */
  async runLoadTest(
    testName: string,
    requests: number,
    concurrency: number,
    requestFn: () => Promise<any>
  ): Promise<LoadTestResult> {
    const startTime = new Date();
    const results: LoadTestResult['results'] = [];
    const semaphore = new Array(concurrency).fill(null);
    let completedRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    // Create request promises
    const requestPromises = Array.from({ length: requests }, async (_, index) => {
      // Wait for available slot
      await new Promise(resolve => {
        const checkSlot = () => {
          const slotIndex = semaphore.findIndex(slot => slot === null);
          if (slotIndex !== -1) {
            semaphore[slotIndex] = index;
            resolve(undefined);
          } else {
            setTimeout(checkSlot, 10);
          }
        };
        checkSlot();
      });

      const requestStart = Date.now();
      const requestId = this.generateId();

      try {
        await requestFn();
        const duration = Date.now() - requestStart;
        
        results.push({
          requestId,
          duration,
          success: true,
          timestamp: new Date(),
        });
        
        successfulRequests++;
      } catch (error) {
        const duration = Date.now() - requestStart;
        
        results.push({
          requestId,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
        
        failedRequests++;
      } finally {
        completedRequests++;
        
        // Release slot
        const slotIndex = semaphore.findIndex(slot => slot === index);
        if (slotIndex !== -1) {
          semaphore[slotIndex] = null;
        }
      }
    });

    // Wait for all requests to complete
    await Promise.all(requestPromises);
    
    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    
    const loadTestResult: LoadTestResult = {
      id: this.generateId(),
      testName,
      startTime,
      endTime,
      totalRequests: requests,
      successfulRequests,
      failedRequests,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      throughput: (requests / totalDuration) * 1000,
      concurrency,
      results,
    };

    // Store load test result
    await this.storeLoadTestResult(loadTestResult);

    return loadTestResult;
  }

  // ============================================================================
  // PERFORMANCE DASHBOARD
  // ============================================================================

  /**
   * Get real-time performance dashboard
   */
  async getPerformanceDashboard(timeRange: { start: Date; end: Date }): Promise<PerformanceDashboard> {
    const cacheKey = `performance-dashboard:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`;
    
    // Try cache first
    const cached = await analyticsCache.get<PerformanceDashboard>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get metrics from database
    const [metrics, alerts, slowOperations] = await Promise.all([
      this.getMetricsInRange(timeRange),
      this.getActiveAlerts(),
      this.getTopSlowOperations(timeRange),
    ]);

    // Calculate real-time metrics
    const realTime = this.calculateRealTimeMetrics(metrics);
    
    // Calculate historical trends
    const historical = this.calculateHistoricalTrends(metrics, timeRange);
    
    // Get resource usage
    const resourceUsage = await this.getResourceUsage();

    const dashboard: PerformanceDashboard = {
      realTime,
      historical,
      alerts,
      topSlowOperations: slowOperations,
      resourceUsage,
    };

    // Cache the result
    await analyticsCache.set(cacheKey, dashboard, 60); // 1 minute cache

    return dashboard;
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    // Response time alerts
    if (metric.duration > this.ALERT_THRESHOLDS.responseTime.critical) {
      this.createAlert(
        'response_time',
        'critical',
        `Critical response time: ${metric.operation} took ${metric.duration}ms`,
        this.ALERT_THRESHOLDS.responseTime.critical,
        metric.duration,
        { operation: metric.operation, userId: metric.userId }
      );
    } else if (metric.duration > this.ALERT_THRESHOLDS.responseTime.warning) {
      this.createAlert(
        'response_time',
        'medium',
        `High response time: ${metric.operation} took ${metric.duration}ms`,
        this.ALERT_THRESHOLDS.responseTime.warning,
        metric.duration,
        { operation: metric.operation, userId: metric.userId }
      );
    }

    // Error rate alerts (tracked over time)
    if (!metric.success) {
      this.trackErrorRate(metric.operation);
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    threshold: number,
    currentValue: number,
    context: Record<string, any>
  ): void {
    const alert: PerformanceAlert = {
      id: this.generateId(),
      type,
      severity,
      message,
      threshold,
      currentValue,
      timestamp: new Date(),
      resolved: false,
      context,
    };

    this.alertsBuffer.push(alert);

    // Send immediate alert for critical issues
    if (severity === 'critical') {
      this.sendImmediateAlert(alert);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async flushBuffers(): Promise<void> {
    await Promise.all([
      this.flushMetricsBuffer(),
      this.flushAlertsBuffer(),
    ]);
  }

  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Store metrics in database
    await this.storeMetrics(metrics);
  }

  private async flushAlertsBuffer(): Promise<void> {
    if (this.alertsBuffer.length === 0) return;

    const alerts = [...this.alertsBuffer];
    this.alertsBuffer = [];

    // Store alerts in database
    await this.storeAlerts(alerts);
  }

  private startRealTimeMonitoring(): void {
    // Monitor system resources every 30 seconds
    setInterval(async () => {
      try {
        const resourceUsage = await this.getResourceUsage();
        
        // Check for resource alerts
        if (resourceUsage.memoryUsage > 80) {
          this.createAlert(
            'memory_usage',
            'high',
            `High memory usage: ${resourceUsage.memoryUsage}%`,
            80,
            resourceUsage.memoryUsage,
            { resourceType: 'memory' }
          );
        }
        
        if (resourceUsage.cpuUsage > 90) {
          this.createAlert(
            'memory_usage',
            'critical',
            `Critical CPU usage: ${resourceUsage.cpuUsage}%`,
            90,
            resourceUsage.cpuUsage,
            { resourceType: 'cpu' }
          );
        }
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 30000);
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async storeMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // TODO: Implement database storage for performance metrics
    console.log(`Storing ${metrics.length} performance metrics`);
  }

  private async storeAlerts(alerts: PerformanceAlert[]): Promise<void> {
    // TODO: Implement database storage for performance alerts
    console.log(`Storing ${alerts.length} performance alerts`);
  }

  private async storeLoadTestResult(result: LoadTestResult): Promise<void> {
    // TODO: Implement database storage for load test results
    console.log(`Storing load test result: ${result.testName}`);
  }

  private async getMetricsInRange(timeRange: { start: Date; end: Date }): Promise<PerformanceMetric[]> {
    // TODO: Implement database query for metrics in time range
    return [];
  }

  private async getActiveAlerts(): Promise<PerformanceAlert[]> {
    // TODO: Implement database query for active alerts
    return [];
  }

  private async getTopSlowOperations(timeRange: { start: Date; end: Date }): Promise<Array<{ operation: string; averageDuration: number; count: number }>> {
    // TODO: Implement database query for slow operations
    return [];
  }

  private async getResourceUsage(): Promise<{ memoryUsage: number; cpuUsage: number; databaseConnections: number; cacheSize: number }> {
    // TODO: Implement actual resource monitoring
    return {
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 100,
      databaseConnections: Math.floor(Math.random() * 10),
      cacheSize: Math.floor(Math.random() * 1000),
    };
  }

  private calculateRealTimeMetrics(metrics: PerformanceMetric[]): PerformanceDashboard['realTime'] {
    const recentMetrics = metrics.filter(m => 
      m.timestamp.getTime() > Date.now() - 60000 // Last minute
    );

    const successfulMetrics = recentMetrics.filter(m => m.success);
    const errorRate = recentMetrics.length > 0 ? 
      (recentMetrics.length - successfulMetrics.length) / recentMetrics.length : 0;

    return {
      currentResponseTime: recentMetrics.length > 0 ? 
        recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length : 0,
      requestsPerSecond: recentMetrics.length / 60,
      errorRate: errorRate * 100,
      activeUsers: new Set(recentMetrics.map(m => m.userId).filter(Boolean)).size,
      cacheHitRate: recentMetrics.length > 0 ? 
        (recentMetrics.filter(m => m.metadata.cacheHit).length / recentMetrics.length) * 100 : 0,
    };
  }

  private calculateHistoricalTrends(metrics: PerformanceMetric[], timeRange: { start: Date; end: Date }): PerformanceDashboard['historical'] {
    // TODO: Implement historical trend calculation
    return {
      responseTimeTrend: [],
      throughputTrend: [],
      errorRateTrend: [],
    };
  }

  private trackErrorRate(operation: string): void {
    // TODO: Implement error rate tracking
  }

  private async sendImmediateAlert(alert: PerformanceAlert): Promise<void> {
    // TODO: Implement immediate alert sending (email, Slack, etc.)
    console.error('CRITICAL ALERT:', alert.message, alert.context);
  }
}

// ============================================================================
// EXPORTED INSTANCE
// ============================================================================

export const performanceMonitoring = PerformanceMonitoringService.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function trackPerformance(
  operation: string,
  duration: number,
  success: boolean,
  userId?: string,
  metadata?: Record<string, any>,
  error?: string
): void {
  performanceMonitoring.trackPerformance(operation, duration, success, userId, metadata, error);
}

export function trackDatabasePerformance(
  query: string,
  duration: number,
  success: boolean,
  userId?: string,
  metadata?: Record<string, any>
): void {
  performanceMonitoring.trackDatabasePerformance(query, duration, success, userId, metadata);
}

export function trackExternalApiPerformance(
  api: string,
  duration: number,
  success: boolean,
  userId?: string,
  metadata?: Record<string, any>
): void {
  performanceMonitoring.trackExternalApiPerformance(api, duration, success, userId, metadata);
} 