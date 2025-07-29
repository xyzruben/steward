// ============================================================================
// ENHANCED LOGGING SERVICE - AI-First Architecture
// ============================================================================
// Enhanced logging with performance monitoring and structured logging
// Focuses on essential logging with performance insights

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  duration?: number;
  userId?: string;
  requestId?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  userId?: string;
  success: boolean;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';
  private performanceMetrics: PerformanceMetric[] = [];
  private maxMetrics = 100;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data, context);
    }
  }

  info(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data, context);
    }
  }

  warn(message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, data, context);
    }
  }

  error(message: string, error?: any, context?: { userId?: string; requestId?: string }): void {
    if (this.shouldLog('error')) {
      this.log('error', message, error, context);
    }
  }

  private log(level: LogLevel, message: string, data?: any, context?: { userId?: string; requestId?: string }): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId: context?.userId,
      requestId: context?.requestId
    };

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  // Performance monitoring methods
  startTimer(operation: string, userId?: string): () => void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    return (success = true) => {
      const duration = Date.now() - startTime;
      this.recordPerformanceMetric(operation, duration, userId, success);
      
      if (duration > 1000) { // Log slow operations
        this.warn(`Slow operation detected: ${operation} took ${duration}ms`, {
          operation,
          duration,
          userId,
          requestId
        });
      }
    };
  }

  private recordPerformanceMetric(operation: string, duration: number, userId?: string, success = true): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      userId,
      success
    };

    this.performanceMetrics.push(metric);
    
    // Keep only the latest metrics
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics);
    }
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  getAverageResponseTime(operation?: string): number {
    const metrics = operation 
      ? this.performanceMetrics.filter(m => m.operation === operation)
      : this.performanceMetrics;
    
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  getSlowestOperations(limit = 5): PerformanceMetric[] {
    return [...this.performanceMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clearMetrics(): void {
    this.performanceMetrics = [];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
}

export const logger = Logger.getInstance(); 