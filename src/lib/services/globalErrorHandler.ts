// Global Error Handler for Next.js API Routes
// Addresses: Stack trace exposure and unhandled errors in production
// Provides consistent error response format across all API endpoints

import { NextRequest, NextResponse } from 'next/server'
import { SecureErrorHandler } from './errorHandler'
import { secureLog } from './logger'

export interface GlobalErrorContext {
  endpoint: string
  method: string
  userId?: string
  ip?: string
  userAgent?: string
}

/**
 * Wrap API route handlers with global error handling
 */
export function withGlobalErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  endpoint: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Set up context for error tracking
      const context: GlobalErrorContext = {
        endpoint,
        method: request.method,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || undefined
      }

      // Add userId to context if available (from auth middleware)
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        // Extract user info if needed - this would depend on your auth implementation
        // For now, we'll leave it undefined and let individual handlers set it
      }

      // Execute the handler
      return await handler(request)
    } catch (error) {
      // Prevent any unhandled errors from exposing stack traces
      return handleGlobalError(error, {
        endpoint,
        method: request.method,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || undefined
      })
    }
  }
}

/**
 * Handle global unhandled errors
 */
function handleGlobalError(error: any, context: GlobalErrorContext): NextResponse {
  // Log the error securely
  secureLog.security('Unhandled API error', 'high', {
    endpoint: context.endpoint,
    method: context.method,
    errorType: error?.constructor?.name || 'Unknown',
    timestamp: new Date().toISOString()
  })

  // Return sanitized error response
  return SecureErrorHandler.handleUnknownError(error, {
    endpoint: context.endpoint,
    ip: context.ip,
    userAgent: context.userAgent
  })
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

/**
 * Enhanced error boundary for development vs production
 */
export class ApiErrorBoundary {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Process error for safe client response
   */
  static processError(error: any, context?: GlobalErrorContext): {
    shouldExposeDetails: boolean
    sanitizedError: any
    logLevel: 'warn' | 'error'
  } {
    // Determine if we should expose error details
    const shouldExposeDetails = this.isDevelopment && this.isNonSensitiveError(error)
    
    // Sanitize error for logging and response
    const sanitizedError = this.sanitizeError(error)
    
    // Determine log level based on error type
    const logLevel = this.getLogLevel(error)

    return {
      shouldExposeDetails,
      sanitizedError,
      logLevel
    }
  }

  /**
   * Check if error contains sensitive information
   */
  private static isNonSensitiveError(error: any): boolean {
    if (!error) return false
    
    const errorMessage = (error.message || error.toString()).toLowerCase()
    
    // Don't expose these types of errors even in development
    const sensitivePatterns = [
      'password', 'secret', 'token', 'key', 'credential', 'auth',
      'database_url', 'api_key', 'connection string', 'jwt',
      'sk-', 'postgresql://', 'mongodb://', 'mysql://'
    ]
    
    return !sensitivePatterns.some(pattern => errorMessage.includes(pattern))
  }

  /**
   * Sanitize error for safe display/logging
   */
  private static sanitizeError(error: any): any {
    if (!error) return null

    const sanitized: any = {
      type: error.constructor?.name || 'Error',
      message: this.sanitizeMessage(error.message || error.toString())
    }

    // Only include stack trace in development and for non-sensitive errors
    if (this.isDevelopment && this.isNonSensitiveError(error) && error.stack) {
      sanitized.stack = this.sanitizeStackTrace(error.stack)
    }

    return sanitized
  }

  /**
   * Sanitize error message
   */
  private static sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') return 'Unknown error'
    
    return message
      // Remove file paths
      .replace(/\/[a-zA-Z0-9\/_.-]+/g, '[PATH]')
      // Remove API keys
      .replace(/sk-[a-zA-Z0-9\-_]+/g, '[API_KEY]')
      // Remove database URLs
      .replace(/postgresql:\/\/[^\s]+/g, '[DATABASE_URL]')
      .replace(/mongodb:\/\/[^\s]+/g, '[DATABASE_URL]')
      // Remove JWT tokens
      .replace(/eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, '[JWT_TOKEN]')
      // Remove email addresses
      .replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL]')
      // Truncate very long messages
      .substring(0, 300)
  }

  /**
   * Sanitize stack trace for development debugging
   */
  private static sanitizeStackTrace(stack: string): string {
    if (!stack || typeof stack !== 'string') return ''
    
    return stack
      .split('\n')
      .map(line => 
        line
          // Replace absolute paths with relative paths
          .replace(/\/[a-zA-Z0-9\/_.-]*\/steward/g, '[PROJECT]')
          .replace(/\/[a-zA-Z0-9\/_.-]*\/node_modules/g, '[NODE_MODULES]')
          // Remove user-specific paths
          .replace(/\/Users\/[^\/]+/g, '[USER_HOME]')
      )
      .slice(0, 10) // Limit stack trace length
      .join('\n')
  }

  /**
   * Determine appropriate log level for error
   */
  private static getLogLevel(error: any): 'warn' | 'error' {
    if (!error) return 'error'
    
    const errorMessage = (error.message || error.toString()).toLowerCase()
    const errorName = error.constructor?.name?.toLowerCase() || ''

    // These are typically user errors, not system errors
    const userErrorPatterns = [
      'validation', 'invalid input', 'bad request', 'unauthorized',
      'forbidden', 'not found', 'rate limit', 'file too large'
    ]

    if (userErrorPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorName.includes(pattern)
    )) {
      return 'warn'
    }

    return 'error'
  }
}

// Environment-specific configuration
export const ERROR_CONFIG = {
  EXPOSE_STACK_TRACE: process.env.NODE_ENV === 'development',
  EXPOSE_ERROR_DETAILS: process.env.NODE_ENV === 'development',
  LOG_FULL_ERRORS: true,
  MAX_ERROR_MESSAGE_LENGTH: process.env.NODE_ENV === 'development' ? 1000 : 200,
  MAX_STACK_TRACE_LINES: process.env.NODE_ENV === 'development' ? 20 : 0
} as const