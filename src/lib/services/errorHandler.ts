// Secure Error Handling Service
// Addresses: Insufficient Error Handling vulnerability from security audit
// Provides sanitized error responses and prevents information disclosure

import { NextResponse } from 'next/server'
import { secureLog } from './logger'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'file_upload' | 'ai_processing' | 'database' | 'external_api' | 'internal'

export interface ErrorContext {
  userId?: string
  endpoint?: string
  requestId?: string
  userAgent?: string
  ip?: string
}

export interface SecureErrorResponse {
  error: string
  message: string
  code?: string
  timestamp: string
  requestId?: string
  retryAfter?: number
  supportDetails?: string
}

export interface ErrorMapping {
  publicMessage: string
  category: ErrorCategory
  severity: ErrorSeverity
  includeDetails: boolean
  httpStatus: number
  logLevel: 'warn' | 'error'
}

// Mapping of internal errors to safe public messages
const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // Authentication errors
  'UNAUTHORIZED': {
    publicMessage: 'Authentication required. Please log in.',
    category: 'authentication',
    severity: 'medium',
    includeDetails: false,
    httpStatus: 401,
    logLevel: 'warn'
  },
  'INVALID_TOKEN': {
    publicMessage: 'Invalid or expired authentication token.',
    category: 'authentication', 
    severity: 'medium',
    includeDetails: false,
    httpStatus: 401,
    logLevel: 'warn'
  },
  'ACCESS_DENIED': {
    publicMessage: 'Access denied. Insufficient permissions.',
    category: 'authorization',
    severity: 'high',
    includeDetails: false,
    httpStatus: 403,
    logLevel: 'error'
  },

  // Validation errors
  'INVALID_INPUT': {
    publicMessage: 'Invalid input provided.',
    category: 'validation',
    severity: 'low',
    includeDetails: true,
    httpStatus: 400,
    logLevel: 'warn'
  },
  'FILE_TOO_LARGE': {
    publicMessage: 'File size exceeds the maximum allowed limit.',
    category: 'file_upload',
    severity: 'low',
    includeDetails: true,
    httpStatus: 400,
    logLevel: 'warn'
  },
  'INVALID_FILE_TYPE': {
    publicMessage: 'Unsupported file type.',
    category: 'file_upload',
    severity: 'medium',
    includeDetails: true,
    httpStatus: 400,
    logLevel: 'warn'
  },

  // Rate limiting
  'RATE_LIMIT_EXCEEDED': {
    publicMessage: 'Too many requests. Please try again later.',
    category: 'rate_limit',
    severity: 'medium',
    includeDetails: true,
    httpStatus: 429,
    logLevel: 'warn'
  },

  // AI Processing errors
  'AI_PROCESSING_FAILED': {
    publicMessage: 'Unable to process request at this time. Please try again.',
    category: 'ai_processing',
    severity: 'medium',
    includeDetails: false,
    httpStatus: 500,
    logLevel: 'error'
  },
  'AI_RATE_LIMIT': {
    publicMessage: 'AI processing temporarily unavailable. Please try again shortly.',
    category: 'ai_processing',
    severity: 'medium',
    includeDetails: true,
    httpStatus: 429,
    logLevel: 'warn'
  },

  // Database errors
  'DATABASE_ERROR': {
    publicMessage: 'A database error occurred. Please try again.',
    category: 'database',
    severity: 'high',
    includeDetails: false,
    httpStatus: 500,
    logLevel: 'error'
  },
  'RECORD_NOT_FOUND': {
    publicMessage: 'The requested resource was not found.',
    category: 'database',
    severity: 'low',
    includeDetails: false,
    httpStatus: 404,
    logLevel: 'warn'
  },

  // External API errors
  'EXTERNAL_API_ERROR': {
    publicMessage: 'External service temporarily unavailable.',
    category: 'external_api',
    severity: 'medium',
    includeDetails: false,
    httpStatus: 503,
    logLevel: 'error'
  },

  // Generic fallbacks
  'INTERNAL_ERROR': {
    publicMessage: 'An internal error occurred. Please try again.',
    category: 'internal',
    severity: 'high',
    includeDetails: false,
    httpStatus: 500,
    logLevel: 'error'
  }
}

export class SecureErrorHandler {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Create a secure error response that doesn't leak sensitive information
   */
  static createSecureResponse(
    errorCode: string,
    originalError?: any,
    context?: ErrorContext,
    details?: string
  ): NextResponse {
    const errorMapping = ERROR_MAPPINGS[errorCode] || ERROR_MAPPINGS['INTERNAL_ERROR']
    const requestId = this.generateRequestId()

    // Log the actual error securely
    this.logSecureError(errorCode, originalError, context, requestId)

    // Create sanitized response
    const response: SecureErrorResponse = {
      error: errorMapping.publicMessage,
      message: errorMapping.includeDetails && details ? details : errorMapping.publicMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      requestId,
    }

    // Add retry information for rate limiting
    if (errorCode === 'RATE_LIMIT_EXCEEDED' && context && 'retryAfter' in context) {
      response.retryAfter = (context as any).retryAfter
    }

    // Add support details for production errors
    if (!this.isDevelopment && errorMapping.severity === 'high') {
      response.supportDetails = `Reference ID: ${requestId}`
    }

    return NextResponse.json(response, { 
      status: errorMapping.httpStatus,
      headers: {
        'X-Request-ID': requestId,
        'X-Error-Category': errorMapping.category,
      }
    })
  }

  /**
   * Handle and sanitize unknown errors
   */
  static handleUnknownError(
    error: any,
    context?: ErrorContext,
    customMessage?: string
  ): NextResponse {
    const errorCode = this.classifyError(error)
    const requestId = this.generateRequestId()

    // Log the full error details securely
    this.logSecureError(errorCode, error, context, requestId)

    // Determine if we should expose any error details
    const shouldExposeDetails = this.isDevelopment && this.isNonSensitiveError(error)
    
    let publicMessage = customMessage || ERROR_MAPPINGS[errorCode].publicMessage
    
    if (shouldExposeDetails) {
      // In development, show more details for non-sensitive errors
      publicMessage += ` (Dev: ${this.sanitizeErrorMessage(error.message || error)})`
    }

    const response: SecureErrorResponse = {
      error: publicMessage,
      message: publicMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
      requestId,
    }

    if (!this.isDevelopment) {
      response.supportDetails = `Reference ID: ${requestId}`
    }

    return NextResponse.json(response, { 
      status: ERROR_MAPPINGS[errorCode].httpStatus,
      headers: {
        'X-Request-ID': requestId,
        'X-Error-Category': ERROR_MAPPINGS[errorCode].category,
      }
    })
  }

  /**
   * Classify error type based on error properties
   */
  private static classifyError(error: any): string {
    if (!error) return 'INTERNAL_ERROR'

    const errorMessage = (error.message || error.toString()).toLowerCase()
    const errorName = error.constructor?.name?.toLowerCase() || ''

    // Authentication/Authorization errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return 'UNAUTHORIZED'
    }
    if (errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
      return 'ACCESS_DENIED'
    }
    if (errorMessage.includes('token') && errorMessage.includes('invalid')) {
      return 'INVALID_TOKEN'
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'RATE_LIMIT_EXCEEDED'
    }

    // File upload errors
    if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
      return 'FILE_TOO_LARGE'
    }
    if (errorMessage.includes('file type') || errorMessage.includes('unsupported format')) {
      return 'INVALID_FILE_TYPE'
    }

    // AI/OpenAI errors
    if (errorMessage.includes('openai') || errorMessage.includes('ai processing')) {
      return 'AI_PROCESSING_FAILED'
    }

    // Database errors
    if (errorName.includes('prisma') || errorMessage.includes('database') || errorMessage.includes('sql')) {
      return 'DATABASE_ERROR'
    }
    if (errorMessage.includes('not found') && errorMessage.includes('record')) {
      return 'RECORD_NOT_FOUND'
    }

    // External API errors
    if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
      return 'EXTERNAL_API_ERROR'
    }

    // Validation errors
    if (errorName.includes('validation') || errorMessage.includes('invalid input')) {
      return 'INVALID_INPUT'
    }

    return 'INTERNAL_ERROR'
  }

  /**
   * Check if error is non-sensitive and can show details in development
   */
  private static isNonSensitiveError(error: any): boolean {
    if (!error) return false
    
    const errorMessage = (error.message || error.toString()).toLowerCase()
    
    // Don't expose these types of errors even in development
    const sensitivePatterns = [
      'password', 'secret', 'token', 'key', 'credential',
      'database_url', 'api_key', 'connection string'
    ]
    
    return !sensitivePatterns.some(pattern => errorMessage.includes(pattern))
  }

  /**
   * Sanitize error message for safe display
   */
  private static sanitizeErrorMessage(message: string): string {
    if (!message || typeof message !== 'string') return 'Unknown error'
    
    return message
      // Remove file paths
      .replace(/\/[a-zA-Z0-9\/_.-]+/g, '[PATH]')
      // Remove API keys
      .replace(/sk-[a-zA-Z0-9\-_]+/g, '[API_KEY]')
      // Remove tokens
      .replace(/eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, '[JWT_TOKEN]')
      // Remove database URLs
      .replace(/postgresql:\/\/[^\s]+/g, '[DB_URL]')
      // Remove email addresses
      .replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL]')
      // Truncate long messages
      .substring(0, 200)
  }

  /**
   * Log error securely without exposing sensitive information
   */
  private static logSecureError(
    errorCode: string,
    originalError: any,
    context?: ErrorContext,
    requestId?: string
  ): void {
    const errorMapping = ERROR_MAPPINGS[errorCode] || ERROR_MAPPINGS['INTERNAL_ERROR']
    
    const logData = {
      errorCode,
      category: errorMapping.category,
      severity: errorMapping.severity,
      endpoint: context?.endpoint,
      userId: context?.userId?.substring(0, 8) + '***',
      requestId,
      timestamp: new Date().toISOString(),
      // Sanitized error details
      errorType: originalError?.constructor?.name || 'Unknown',
      sanitizedMessage: this.sanitizeErrorMessage(originalError?.message || 'No message')
    }

    if (errorMapping.logLevel === 'error') {
      secureLog.security(`Error: ${errorCode}`, errorMapping.severity, logData)
    } else {
      console.warn(`[WARN] [${errorMapping.category.toUpperCase()}] ${errorCode}`, logData)
    }
  }

  /**
   * Generate unique request ID for error tracking
   */
  private static generateRequestId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  /**
   * Wrap async operations with secure error handling
   */
  static async safeAsync<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    errorCode?: string
  ): Promise<T | NextResponse> {
    try {
      return await operation()
    } catch (error) {
      return this.handleUnknownError(error, context, errorCode ? ERROR_MAPPINGS[errorCode]?.publicMessage : undefined)
    }
  }

  /**
   * Create a validation error response
   */
  static validationError(message: string, context?: ErrorContext): NextResponse {
    return this.createSecureResponse('INVALID_INPUT', null, context, message)
  }

  /**
   * Create an authentication error response
   */
  static authError(context?: ErrorContext): NextResponse {
    return this.createSecureResponse('UNAUTHORIZED', null, context)
  }

  /**
   * Create a rate limit error response
   */
  static rateLimitError(retryAfter: number, context?: ErrorContext): NextResponse {
    const contextWithRetry = { ...context, retryAfter }
    return this.createSecureResponse('RATE_LIMIT_EXCEEDED', null, contextWithRetry)
  }

  /**
   * Create a file upload error response
   */
  static fileUploadError(message: string, context?: ErrorContext): NextResponse {
    const errorCode = message.toLowerCase().includes('size') ? 'FILE_TOO_LARGE' : 'INVALID_FILE_TYPE'
    return this.createSecureResponse(errorCode, null, context, message)
  }
}

// Convenience functions for common error scenarios
export const secureError = {
  validation: (message: string, context?: ErrorContext) => 
    SecureErrorHandler.validationError(message, context),
  
  auth: (context?: ErrorContext) => 
    SecureErrorHandler.authError(context),
  
  rateLimit: (retryAfter: number, context?: ErrorContext) => 
    SecureErrorHandler.rateLimitError(retryAfter, context),
  
  fileUpload: (message: string, context?: ErrorContext) => 
    SecureErrorHandler.fileUploadError(message, context),
  
  unknown: (error: any, context?: ErrorContext) => 
    SecureErrorHandler.handleUnknownError(error, context),
  
  ai: (error: any, context?: ErrorContext) => 
    SecureErrorHandler.createSecureResponse('AI_PROCESSING_FAILED', error, context),
  
  database: (error: any, context?: ErrorContext) => 
    SecureErrorHandler.createSecureResponse('DATABASE_ERROR', error, context)
}