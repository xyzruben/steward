import { prisma } from '../prisma'

/**
 * Database service with connection health checks and retry logic
 * Optimized for Supabase connection pooler performance
 */
export class DatabaseService {
  private static instance: DatabaseService
  private connectionHealthy = true
  private lastHealthCheck = 0
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  /**
   * Check database connection health
   * Returns true if connection is healthy, false otherwise
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now()
    
    // Cache health check results for 30 seconds
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return this.connectionHealthy
    }

    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1`
      this.connectionHealthy = true
      this.lastHealthCheck = now
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      this.connectionHealthy = false
      this.lastHealthCheck = now
      return false
    }
  }

  /**
   * Execute database operation with retry logic
   * Retries failed operations up to 3 times with exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check connection health before operation
        const isHealthy = await this.checkHealth()
        if (!isHealthy && attempt > 0) {
          // Wait longer if connection is unhealthy
          await this.delay(baseDelay * Math.pow(2, attempt))
          continue
        }

        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw error
        }

        // Don't retry on certain errors
        if (this.isNonRetryableError(error as Error)) {
          throw error
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error)
        await this.delay(delay)
      }
    }

    throw lastError!
  }

  /**
   * Determine if an error is non-retryable
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'Unique constraint',
      'Foreign key constraint',
      'Check constraint',
      'Invalid input',
      'Permission denied'
    ]

    return nonRetryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    )
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    try {
      const startTime = Date.now()
      await this.checkHealth()
      const responseTime = Date.now() - startTime

      return {
        healthy: this.connectionHealthy,
        responseTime,
        lastCheck: this.lastHealthCheck
      }
    } catch (error) {
      return {
        healthy: false,
        responseTime: -1,
        lastCheck: this.lastHealthCheck,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance() 