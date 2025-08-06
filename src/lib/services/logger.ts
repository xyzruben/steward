// ============================================================================
// SECURE LOGGING SERVICE - Security Enhanced
// ============================================================================
// Enhanced logging with performance monitoring and structured logging
// SECURITY FIX: Addresses "Logging Sensitive Information" vulnerability
// Includes data sanitization and sensitive information filtering

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type SecurityLevel = 'public' | 'internal' | 'sensitive' | 'pii';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  securityLevel?: SecurityLevel;
  message: string;
  data?: any;
  duration?: number;
  userId?: string;
  requestId?: string;
  sanitized?: boolean;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  userId?: string;
  success: boolean;
}

// Sensitive data patterns to filter out
const SENSITIVE_PATTERNS = {
  // Financial data
  total: /(\$?\d+\.?\d*)/g,
  currency: /(USD|EUR|GBP|CAD|\$|€|£)/gi,
  amount: /amount[:\s]*(\$?\d+\.?\d*)/gi,
  
  // Personal information
  email: /[\w\.-]+@[\w\.-]+\.\w+/g,
  phone: /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  
  // API keys and tokens
  apiKey: /(?:api[-_]?key|token|secret|password)[:\s=]*([a-zA-Z0-9\-_.]{10,})/gi,
  jwt: /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]*/g,
  
  // Database connection strings
  dbUrl: /(?:database|db)[-_]?url[:\s=]*([^\s]+)/gi,
  connectionString: /postgresql:\/\/[^\s]+/gi,
  
  // Credit card patterns
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
}

// PII field names to redact
const PII_FIELDS = [
  'merchant', 'total', 'amount', 'summary', 'tags', 'category',
  'email', 'name', 'phone', 'address', 'ssn', 'creditCard',
  'password', 'secret', 'token', 'apiKey', 'purchaseDate'
]

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';
  private performanceMetrics: PerformanceMetric[] = [];
  private maxMetrics = 100;
  private enableDataSanitization = true;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, data?: any, context?: { userId?: string; requestId?: string; securityLevel?: SecurityLevel }): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data, context);
    }
  }

  info(message: string, data?: any, context?: { userId?: string; requestId?: string; securityLevel?: SecurityLevel }): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data, context);
    }
  }

  warn(message: string, data?: any, context?: { userId?: string; requestId?: string; securityLevel?: SecurityLevel }): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, data, context);
    }
  }

  error(message: string, error?: any, context?: { userId?: string; requestId?: string; securityLevel?: SecurityLevel }): void {
    if (this.shouldLog('error')) {
      this.log('error', message, error, context);
    }
  }

  // SECURITY: Specialized secure logging methods
  
  /**
   * Log receipt processing without sensitive financial data
   */
  logReceiptProcessing(receiptId: string, status: string, context?: { userId?: string }): void {
    this.info(`Receipt processing: ${receiptId} - ${status}`, {
      receiptId,
      status,
      timestamp: new Date().toISOString()
    }, {
      userId: context?.userId,
      securityLevel: 'internal'
    });
  }

  /**
   * Log user activity without exposing sensitive details
   */
  logUserActivity(userId: string, activity: string, metadata?: Record<string, any>): void {
    const sanitizedMetadata = this.sanitizeData(metadata || {});
    this.info(`User activity: ${activity}`, {
      userId: userId.substring(0, 8) + '***', // Partially mask user ID
      activity,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString()
    }, {
      securityLevel: 'internal'
    });
  }

  /**
   * Log security events with full context
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, any>): void {
    const sanitizedDetails = this.sanitizeData(details || {});
    this.error(`SECURITY EVENT [${severity.toUpperCase()}]: ${event}`, {
      event,
      severity,
      details: sanitizedDetails,
      timestamp: new Date().toISOString()
    }, {
      securityLevel: 'sensitive'
    });
  }

  /**
   * Log API errors without exposing sensitive information
   */
  logApiError(endpoint: string, error: any, context?: { userId?: string }): void {
    const sanitizedError = this.sanitizeError(error);
    this.error(`API Error on ${endpoint}`, {
      endpoint,
      errorType: sanitizedError.type,
      message: sanitizedError.message,
      timestamp: new Date().toISOString()
    }, {
      userId: context?.userId?.substring(0, 8) + '***',
      securityLevel: 'internal'
    });
  }

  private log(level: LogLevel, message: string, data?: any, context?: { userId?: string; requestId?: string; securityLevel?: SecurityLevel }): void {
    // SECURITY: Sanitize data based on security level
    let sanitizedData = data;
    let wasSanitized = false;
    
    if (this.enableDataSanitization && data) {
      const securityLevel = context?.securityLevel || 'internal';
      sanitizedData = this.sanitizeDataBySecurityLevel(data, securityLevel);
      wasSanitized = sanitizedData !== data;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      securityLevel: context?.securityLevel,
      message,
      data: sanitizedData,
      userId: context?.userId,
      requestId: context?.requestId,
      sanitized: wasSanitized
    };

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}]${entry.securityLevel ? ` [${entry.securityLevel.toUpperCase()}]` : ''} ${message}`;
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(logMessage, sanitizedData || '');
        break;
      case 'warn':
        console.warn(logMessage, sanitizedData || '');
        break;
      case 'error':
        console.error(logMessage, sanitizedData || '');
        break;
    }
  }

  // SECURITY: Data sanitization methods
  
  /**
   * Sanitize data based on security level
   */
  private sanitizeDataBySecurityLevel(data: any, securityLevel: SecurityLevel): any {
    switch (securityLevel) {
      case 'public':
        return this.sanitizeData(data, ['basic']); // Light sanitization
      case 'internal':
        return this.sanitizeData(data, ['basic', 'financial']); // Remove financial data
      case 'sensitive':
        return this.sanitizeData(data, ['basic', 'financial', 'pii']); // Remove PII
      case 'pii':
        return '[REDACTED - PII DATA]'; // Complete redaction
      default:
        return this.sanitizeData(data);
    }
  }

  /**
   * Sanitize data by removing or masking sensitive information
   */
  private sanitizeData(data: any, sanitizationLevels: string[] = ['basic', 'financial', 'pii']): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return this.sanitizeString(data, sanitizationLevels);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, sanitizationLevels));
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Check if field name indicates sensitive data
        if (sanitizationLevels.includes('pii') && this.isPIIField(key)) {
          sanitized[key] = this.maskValue(value);
        } else if (sanitizationLevels.includes('financial') && this.isFinancialField(key)) {
          sanitized[key] = this.maskValue(value);
        } else {
          sanitized[key] = this.sanitizeData(value, sanitizationLevels);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(str: string, sanitizationLevels: string[]): string {
    let sanitized = str;
    
    if (sanitizationLevels.includes('basic')) {
      // Remove API keys and tokens
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.apiKey, (match) => 
        match.split('').slice(0, 10).join('') + '***'
      );
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.jwt, '***JWT_TOKEN***');
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.connectionString, '***DB_CONNECTION***');
    }
    
    if (sanitizationLevels.includes('financial')) {
      // Mask financial amounts
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.total, '***');
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.amount, 'amount: ***');
    }
    
    if (sanitizationLevels.includes('pii')) {
      // Mask PII
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, '***@***.***');
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone, '***-***-****');
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.ssn, '***-**-****');
      sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '****-****-****-****');
    }
    
    return sanitized;
  }

  /**
   * Check if field name indicates PII
   */
  private isPIIField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return PII_FIELDS.some(piiField => lowerField.includes(piiField.toLowerCase()));
  }

  /**
   * Check if field name indicates financial data
   */
  private isFinancialField(fieldName: string): boolean {
    const financialFields = ['total', 'amount', 'price', 'cost', 'currency', 'merchant'];
    const lowerField = fieldName.toLowerCase();
    return financialFields.some(finField => lowerField.includes(finField));
  }

  /**
   * Mask sensitive values
   */
  private maskValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 4 ? value.substring(0, 2) + '***' : '***';
    }
    if (typeof value === 'number') {
      return '***';
    }
    return '***';
  }

  /**
   * Sanitize error objects
   */
  private sanitizeError(error: any): { type: string; message: string } {
    if (error instanceof Error) {
      return {
        type: error.constructor.name,
        message: this.sanitizeString(error.message, ['basic', 'financial', 'pii'])
      };
    }
    
    if (typeof error === 'string') {
      return {
        type: 'String Error',
        message: this.sanitizeString(error, ['basic', 'financial', 'pii'])
      };
    }
    
    return {
      type: 'Unknown Error',
      message: 'Error details sanitized'
    };
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

  /**
   * Enable or disable data sanitization
   */
  setDataSanitization(enabled: boolean): void {
    this.enableDataSanitization = enabled;
  }

  /**
   * Test sanitization with sample data
   */
  testSanitization(): void {
    const testData = {
      merchant: 'Walmart',
      total: 15.99,
      email: 'user@example.com',
      apiKey: 'sk-proj-abc123def456',
      summary: 'Purchased groceries for $15.99'
    };

    console.log('Original data:', testData);
    console.log('Sanitized (public):', this.sanitizeDataBySecurityLevel(testData, 'public'));
    console.log('Sanitized (internal):', this.sanitizeDataBySecurityLevel(testData, 'internal'));
    console.log('Sanitized (sensitive):', this.sanitizeDataBySecurityLevel(testData, 'sensitive'));
    console.log('Sanitized (pii):', this.sanitizeDataBySecurityLevel(testData, 'pii'));
  }
}

export const logger = Logger.getInstance();

// Convenience functions for secure logging
export const secureLog = {
  receipt: (receiptId: string, status: string, userId?: string) =>
    logger.logReceiptProcessing(receiptId, status, { userId }),
  
  userActivity: (userId: string, activity: string, metadata?: Record<string, any>) =>
    logger.logUserActivity(userId, activity, metadata),
  
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, any>) =>
    logger.logSecurityEvent(event, severity, details),
  
  apiError: (endpoint: string, error: any, userId?: string) =>
    logger.logApiError(endpoint, error, { userId })
}; 