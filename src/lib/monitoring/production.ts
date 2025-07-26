// ============================================================================
// PRODUCTION MONITORING UTILITIES
// ============================================================================
// Production monitoring and performance tracking for the AI agent
// See: Master System Guide - Monitoring and Observability

import { monitoringService } from '../services/monitoring';

// Performance tracking interface
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

// Alert severity levels
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Alert interface
interface Alert {
  severity: AlertSeverity;
  message: string;
  context: Record<string, any>;
  timestamp: Date;
}

/**
 * Production monitoring utilities for performance tracking and alerting
 */
export class ProductionMonitoring {
  private static instance: ProductionMonitoring;
  private performanceBuffer: PerformanceMetric[] = [];
  private alertBuffer: Alert[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    // Set up periodic buffer flushing
    setInterval(() => this.flushBuffers(), this.FLUSH_INTERVAL);
  }

  static getInstance(): ProductionMonitoring {
    if (!ProductionMonitoring.instance) {
      ProductionMonitoring.instance = new ProductionMonitoring();
    }
    return ProductionMonitoring.instance;
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    operation: string,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      userId,
      metadata,
    };

    this.performanceBuffer.push(metric);

    // Check for performance degradation
    this.checkPerformanceDegradation(metric);

    // Flush buffer if it's full
    if (this.performanceBuffer.length >= this.BUFFER_SIZE) {
      this.flushPerformanceBuffer();
    }
  }

  /**
   * Send alert for critical issues
   */
  sendAlert(
    severity: AlertSeverity,
    message: string,
    context: Record<string, any> = {}
  ): void {
    const alert: Alert = {
      severity,
      message,
      context,
      timestamp: new Date(),
    };

    this.alertBuffer.push(alert);

    // Immediately send critical alerts
    if (severity === 'critical') {
      this.sendImmediateAlert(alert);
    }

    // Flush buffer if it's full
    if (this.alertBuffer.length >= this.BUFFER_SIZE) {
      this.flushAlertBuffer();
    }
  }

  /**
   * Check for performance degradation
   */
  private checkPerformanceDegradation(metric: PerformanceMetric): void {
    const thresholds = {
      'ai_query': 5000, // 5 seconds
      'database_query': 1000, // 1 second
      'cache_operation': 100, // 100ms
      'api_request': 2000, // 2 seconds
    };

    const threshold = thresholds[metric.operation as keyof typeof thresholds];
    if (threshold && metric.duration > threshold) {
      this.sendAlert(
        metric.duration > threshold * 2 ? 'critical' : 'high',
        `Performance degradation: ${metric.operation} took ${metric.duration}ms`,
        {
          operation: metric.operation,
          duration: metric.duration,
          threshold,
          userId: metric.userId,
        }
      );
    }
  }

  /**
   * Send immediate alert for critical issues
   */
  private async sendImmediateAlert(alert: Alert): Promise<void> {
    try {
      // Log critical alert
      console.error('CRITICAL ALERT:', {
        severity: alert.severity,
        message: alert.message,
        context: alert.context,
        timestamp: alert.timestamp.toISOString(),
      });

      // Send to monitoring service
      await monitoringService.logError(
        alert.context.userId || 'system',
        alert.message,
        alert.message,
        {
          functionsUsed: [],
          responseTime: 0,
          timestamp: alert.timestamp,
        },
        JSON.stringify(alert.context)
      );

      // TODO: Send to external alerting service (PagerDuty, Slack, etc.)
      // await sendToAlertingService(alert);
    } catch (error) {
      console.error('Failed to send immediate alert:', error);
    }
  }

  /**
   * Flush performance buffer to monitoring service
   */
  private async flushPerformanceBuffer(): Promise<void> {
    if (this.performanceBuffer.length === 0) return;

    try {
      const metrics = [...this.performanceBuffer];
      this.performanceBuffer = [];

      // Calculate performance statistics
      const stats = this.calculatePerformanceStats(metrics);

      // Log performance statistics
      console.log('Performance Statistics:', {
        timestamp: new Date().toISOString(),
        totalOperations: stats.totalOperations,
        averageDuration: stats.averageDuration,
        maxDuration: stats.maxDuration,
        slowOperations: stats.slowOperations,
      });

      // Send to monitoring service
      for (const metric of metrics) {
        await monitoringService.logAgentQuery(
          metric.userId || 'system',
          `performance_${metric.operation}`,
          metric.duration,
          true,
          [],
          false,
          undefined,
          metric.metadata
        );
      }
    } catch (error) {
      console.error('Failed to flush performance buffer:', error);
    }
  }

  /**
   * Flush alert buffer
   */
  private async flushAlertBuffer(): Promise<void> {
    if (this.alertBuffer.length === 0) return;

    try {
      const alerts = [...this.alertBuffer];
      this.alertBuffer = [];

      // Log all alerts
      for (const alert of alerts) {
        console.log('Alert:', {
          severity: alert.severity,
          message: alert.message,
          context: alert.context,
          timestamp: alert.timestamp.toISOString(),
        });
      }

      // TODO: Send to external alerting service
      // await sendToAlertingService(alerts);
    } catch (error) {
      console.error('Failed to flush alert buffer:', error);
    }
  }

  /**
   * Flush all buffers
   */
  private async flushBuffers(): Promise<void> {
    await Promise.all([
      this.flushPerformanceBuffer(),
      this.flushAlertBuffer(),
    ]);
  }

  /**
   * Calculate performance statistics
   */
  private calculatePerformanceStats(metrics: PerformanceMetric[]): {
    totalOperations: number;
    averageDuration: number;
    maxDuration: number;
    slowOperations: number;
  } {
    const totalOperations = metrics.length;
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
    const maxDuration = Math.max(...metrics.map(m => m.duration));
    const slowOperations = metrics.filter(m => m.duration > 1000).length;

    return {
      totalOperations,
      averageDuration,
      maxDuration,
      slowOperations,
    };
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    performance: {
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    alerts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    try {
      // Get monitoring service health
      const monitoringHealth = await monitoringService.getHealth();

      // Calculate performance metrics
      const performanceStats = this.calculatePerformanceStats(this.performanceBuffer);

      // Count alerts by severity
      const alertCounts = {
        critical: this.alertBuffer.filter(a => a.severity === 'critical').length,
        high: this.alertBuffer.filter(a => a.severity === 'high').length,
        medium: this.alertBuffer.filter(a => a.severity === 'medium').length,
        low: this.alertBuffer.filter(a => a.severity === 'low').length,
      };

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (monitoringHealth.status === 'unhealthy' || alertCounts.critical > 0) {
        status = 'unhealthy';
      } else if (monitoringHealth.status === 'degraded' || alertCounts.high > 0) {
        status = 'degraded';
      }

      return {
        status,
        performance: {
          averageResponseTime: performanceStats.averageDuration,
          errorRate: 0, // TODO: Calculate from monitoring data
          throughput: performanceStats.totalOperations,
        },
        alerts: alertCounts,
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: 'unhealthy',
        performance: {
          averageResponseTime: 0,
          errorRate: 100,
          throughput: 0,
        },
        alerts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };
    }
  }
}

// Export singleton instance
export const productionMonitoring = ProductionMonitoring.getInstance();

// Convenience functions
export function trackPerformance(
  operation: string,
  duration: number,
  userId?: string,
  metadata?: Record<string, any>
): void {
  productionMonitoring.trackPerformance(operation, duration, userId, metadata);
}

export function sendAlert(
  severity: AlertSeverity,
  message: string,
  context: Record<string, any> = {}
): void {
  productionMonitoring.sendAlert(severity, message, context);
}

export async function getSystemHealth() {
  return productionMonitoring.getSystemHealth();
} 