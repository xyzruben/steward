// Secure URL Service for File Access
// Addresses: Public URLs without expiration vulnerability from security audit
// Provides expiring, signed URLs for secure file access

import { createSupabaseServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export interface SecureUrlOptions {
  expiresIn?: number // seconds
  download?: boolean
  transform?: {
    width?: number
    height?: number
    quality?: number
  }
}

export interface SecureUrlResult {
  signedUrl: string
  expiresAt: Date
  isPublic: boolean
}

export class SecureUrlService {
  /**
   * Generate a signed URL with expiration for secure file access
   */
  static async createSignedUrl(
    bucket: string, 
    filePath: string, 
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResult> {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const expiresIn = options.expiresIn || 3600 // Default 1 hour
    const expiresAt = new Date(Date.now() + (expiresIn * 1000))
    
    try {
      // Generate signed URL with expiration
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn, {
          download: options.download || false,
          transform: options.transform
        })

      if (error) {
        console.error('Failed to create signed URL:', error)
        throw new Error(`Failed to create signed URL: ${error.message}`)
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt,
        isPublic: false
      }
    } catch (error) {
      console.error('Error creating signed URL:', error)
      throw error
    }
  }

  /**
   * Create a public URL (less secure, for backward compatibility)
   */
  static async createPublicUrl(
    bucket: string, 
    filePath: string
  ): Promise<SecureUrlResult> {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      signedUrl: data.publicUrl,
      expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year from now
      isPublic: true
    }
  }

  /**
   * Create a secure receipt image URL
   */
  static async createReceiptImageUrl(
    filePath: string,
    options: SecureUrlOptions = {}
  ): Promise<SecureUrlResult> {
    // For receipt images, use shorter expiration times for security
    const secureOptions = {
      expiresIn: options.expiresIn || 7200, // Default 2 hours for receipts
      download: false, // Images should be viewed, not downloaded
      transform: {
        width: options.transform?.width || 800, // Optimize for web display
        quality: options.transform?.quality || 80,
        ...options.transform
      }
    }

    return this.createSignedUrl('receipts', filePath, secureOptions)
  }

  /**
   * Validate if a URL has expired
   */
  static isUrlExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Generate a secure filename with timestamp and user isolation
   */
  static generateSecureFileName(userId: string, originalName: string): string {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    
    // Remove potentially dangerous characters from filename
    const safeName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50) // Limit length
    
    return `${userId}/${timestamp}_${randomSuffix}_${safeName}.${extension}`
  }

  /**
   * Check if user has access to a file path
   */
  static async verifyFileAccess(userId: string, filePath: string): Promise<boolean> {
    // Basic check: file path should start with user ID for isolation
    if (!filePath.startsWith(`${userId}/`)) {
      console.warn('File access violation attempt:', {
        userId,
        filePath,
        timestamp: new Date().toISOString()
      })
      return false
    }
    
    return true
  }

  /**
   * Create URLs for different purposes with appropriate security levels
   */
  static async createContextualUrl(
    filePath: string,
    context: 'receipt_display' | 'receipt_download' | 'thumbnail' | 'export',
    userId?: string
  ): Promise<SecureUrlResult> {
    // Verify access if userId provided
    if (userId && !await this.verifyFileAccess(userId, filePath)) {
      throw new Error('Access denied to file')
    }

    switch (context) {
      case 'receipt_display':
        return this.createReceiptImageUrl(filePath, {
          expiresIn: 7200, // 2 hours
          transform: { width: 800, quality: 80 }
        })
        
      case 'receipt_download':
        return this.createSignedUrl('receipts', filePath, {
          expiresIn: 1800, // 30 minutes
          download: true
        })
        
      case 'thumbnail':
        return this.createSignedUrl('receipts', filePath, {
          expiresIn: 14400, // 4 hours
          transform: { width: 200, height: 200, quality: 70 }
        })
        
      case 'export':
        return this.createSignedUrl('receipts', filePath, {
          expiresIn: 900, // 15 minutes
          download: true
        })
        
      default:
        throw new Error(`Unknown context: ${context}`)
    }
  }
}

// Predefined URL configurations
export const URL_SECURITY_CONFIGS = {
  RECEIPT_DISPLAY: {
    expiresIn: 7200, // 2 hours
    transform: { width: 800, quality: 80 }
  },
  RECEIPT_THUMBNAIL: {
    expiresIn: 14400, // 4 hours  
    transform: { width: 200, height: 200, quality: 70 }
  },
  RECEIPT_DOWNLOAD: {
    expiresIn: 1800, // 30 minutes
    download: true
  }
} as const