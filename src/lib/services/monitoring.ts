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

// ============================================================================
// SECURITY MONITORING & REQUEST LOGGING
// ============================================================================
// Enhanced monitoring for security events and request patterns
// Tracks potential security issues and unusual activity

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  SUSPICIOUS_REQUEST = 'suspicious_request',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  INPUT_VALIDATION_FAILURE = 'input_validation_failure',
  AI_INJECTION_ATTEMPT = 'ai_injection_attempt',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  ERROR_RATE_SPIKE = 'error_rate_spike',
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  ipAddress?: string
  userAgent?: string
  endpoint: string
  method: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, any>
  requestId?: string
}

/**
 * Request logging interface
 */
export interface RequestLog {
  requestId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
  requestSize?: number
  responseSize?: number
  error?: string
  metadata?: Record<string, any>
}

/**
 * Security monitoring service
 */
class SecurityMonitoringService {
  private events: SecurityEvent[] = []
  private requestLogs: RequestLog[] = []
  private readonly maxEvents = 1000
  private readonly maxLogs = 1000

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    }

    this.events.push(securityEvent)
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console for immediate visibility
    console.log('🚨 Security Event:', {
      type: securityEvent.type,
      severity: securityEvent.severity,
      userId: securityEvent.userId,
      endpoint: securityEvent.endpoint,
      timestamp: securityEvent.timestamp.toISOString(),
      details: securityEvent.details,
    })

    // TODO: Send to external monitoring service
    // this.sendToMonitoringService(securityEvent)
  }

  /**
   * Log a request for monitoring
   */
  logRequest(log: Omit<RequestLog, 'timestamp'>) {
    const requestLog: RequestLog = {
      ...log,
      timestamp: new Date(),
    }

    this.requestLogs.push(requestLog)
    
    // Keep only recent logs
    if (this.requestLogs.length > this.maxLogs) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogs)
    }

    // Check for suspicious patterns
    this.analyzeRequestPattern(requestLog)
  }

  /**
   * Analyze request patterns for security issues
   */
  private analyzeRequestPattern(log: RequestLog) {
    // Check for rapid requests (potential DoS)
    const recentRequests = this.requestLogs.filter(
      req => req.userId === log.userId && 
      req.timestamp > new Date(Date.now() - 60000) // Last minute
    )

    if (recentRequests.length > 100) {
      this.logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        userId: log.userId,
        endpoint: log.endpoint,
        method: log.method,
        severity: 'high',
        details: {
          requestCount: recentRequests.length,
          timeWindow: '1 minute',
        },
      })
    }

    // Check for authentication failures
    if (log.statusCode === 401 || log.statusCode === 403) {
      this.logSecurityEvent({
        type: log.statusCode === 401 ? SecurityEventType.AUTHENTICATION_FAILURE : SecurityEventType.AUTHORIZATION_FAILURE,
        userId: log.userId,
        endpoint: log.endpoint,
        method: log.method,
        severity: 'medium',
        details: {
          statusCode: log.statusCode,
          error: log.error,
        },
      })
    }

    // Check for unusual response times
    if (log.responseTime > 10000) { // 10 seconds
      this.logSecurityEvent({
        type: SecurityEventType.UNUSUAL_ACTIVITY,
        userId: log.userId,
        endpoint: log.endpoint,
        method: log.method,
        severity: 'low',
        details: {
          responseTime: log.responseTime,
          threshold: 10000,
        },
      })
    }
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit)
  }

  /**
   * Get recent request logs
   */
  getRecentRequestLogs(limit: number = 100): RequestLog[] {
    return this.requestLogs.slice(-limit)
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = new Date()
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const recentEvents = this.events.filter(e => e.timestamp > lastHour)
    const recentLogs = this.requestLogs.filter(l => l.timestamp > lastHour)

    return {
      totalEvents: this.events.length,
      totalLogs: this.requestLogs.length,
      eventsLastHour: recentEvents.length,
      requestsLastHour: recentLogs.length,
      errorRate: recentLogs.length > 0 
        ? (recentLogs.filter(l => l.statusCode >= 400).length / recentLogs.length) * 100 
        : 0,
      securityEventsByType: this.groupEventsByType(recentEvents),
    }
  }

  /**
   * Group events by type for analysis
   */
  private groupEventsByType(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService()

/**
 * Middleware for request logging and security monitoring
 */
export function createRequestLogger() {
  return function logRequest(
    request: Request,
    response: Response,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    
    // Extract request details
    const url = new URL(request.url)
    const method = request.method
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Log the request
    securityMonitoring.logRequest({
      requestId,
      userId,
      ipAddress,
      userAgent,
      endpoint: url.pathname,
      method,
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      metadata,
    })

    return requestId
  }
}

/**
 * Utility to detect suspicious input patterns
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /system:/gi,
    /assistant:/gi,
    /user:/gi,
    /\/etc\/passwd/gi,
    /\/proc\/self/gi,
    /\/sys\/kernel/gi,
  ]

  return suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Log suspicious input attempts
 */
export function logSuspiciousInput(
  input: string,
  userId?: string,
  endpoint?: string,
  method?: string
) {
  securityMonitoring.logSecurityEvent({
    type: SecurityEventType.AI_INJECTION_ATTEMPT,
    userId,
    endpoint: endpoint || 'unknown',
    method: method || 'unknown',
    severity: 'medium',
    details: {
      inputLength: input.length,
      inputPreview: input.substring(0, 100),
      detectedPatterns: getDetectedPatterns(input),
    },
  })
}

/**
 * Get detected suspicious patterns in input
 */
function getDetectedPatterns(input: string): string[] {
  const patterns = [
    { name: 'script_tag', pattern: /<script>/gi },
    { name: 'javascript_protocol', pattern: /javascript:/gi },
    { name: 'data_uri', pattern: /data:text\/html/gi },
    { name: 'vbscript', pattern: /vbscript:/gi },
    { name: 'event_handler', pattern: /on(load|error|click)=/gi },
    { name: 'prompt_injection', pattern: /(system|assistant|user):/gi },
    { name: 'file_path', pattern: /\/(etc\/passwd|proc\/self|sys\/kernel)/gi },
  ]

  return patterns
    .filter(p => p.pattern.test(input))
    .map(p => p.name)
} 