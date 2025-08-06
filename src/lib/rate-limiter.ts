// Enhanced Rate limiter for API endpoints - Security Enhancement
// Addresses: Insufficient API Rate Limiting vulnerability from security audit
// See: Master System Guide - Security Requirements, Rate Limiting and Validation

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
}

// Predefined rate limit configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // File upload endpoints (stricter limits)
  UPLOAD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 uploads per 15 minutes
  },
  // AI/OpenAI endpoints (moderate limits)
  AI_PROCESSING: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 20, // 20 AI requests per minute
  },
  // Authentication endpoints (very strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 auth attempts per 15 minutes
  },
  // General API endpoints (standard limits)
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Search endpoints (moderate limits)
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  }
} as const

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = RATE_LIMIT_CONFIGS.GENERAL) {
    this.config = config;
  }

  /**
   * Check if request is allowed for the given key
   */
  isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats(): { totalKeys: number; config: RateLimitConfig } {
    return {
      totalKeys: this.limits.size,
      config: this.config,
    };
  }

  /**
   * Generate a key from the request (IP + User ID if available)
   */
  generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    
    // Default key generation: IP address + user agent hash
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const userAgentHash = userAgent.slice(0, 10); // Simple hash
    
    return `${ip}:${userAgentHash}`;
  }
}

// Helper function to get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default IP
  return 'unknown';
}

// Rate limiting middleware function
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimiter = new RateLimiter(config);
  const key = rateLimiter.generateKey(request);
  const result = rateLimiter.isAllowed(key);
  
  if (!result.allowed) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    // Log rate limit violation for security monitoring
    console.warn('Rate limit exceeded', {
      key: key.substring(0, 20), // Log partial key for privacy
      endpoint: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      timestamp: new Date().toISOString()
    });
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter 
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        },
      }
    );
  }
  
  try {
    // Execute the handler
    const response = await handler();
    
    // Add rate limit headers to successful responses
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', config.maxRequests.toString());
    newHeaders.set('X-RateLimit-Remaining', result.remaining.toString());
    newHeaders.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    // Don't count failed requests against rate limit if configured
    if (config.skipFailedRequests) {
      // Would need to implement request rollback here
    }
    throw error;
  }
}

// Convenience functions for common rate limiting patterns
export function createUploadRateLimiter() {
  return new RateLimiter(RATE_LIMIT_CONFIGS.UPLOAD);
}

export function createAIRateLimiter() {
  return new RateLimiter(RATE_LIMIT_CONFIGS.AI_PROCESSING);
}

export function createAuthRateLimiter() {
  return new RateLimiter(RATE_LIMIT_CONFIGS.AUTH);
}

// Global rate limiters (singleton pattern for better performance)
export const uploadRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.UPLOAD);
export const aiRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.AI_PROCESSING);
export const authRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.AUTH);
export const searchRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.SEARCH);

 