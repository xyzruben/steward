// ============================================================================
// USER PROFILE SERVICE
// ============================================================================
// Service for managing user profiles and preferences
// See: Master System Guide - Backend/API Design, Database Schema Design

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  timezone: z.string().min(1).max(50).default('UTC'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF']).default('USD'),
  locale: z.enum(['en-US', 'en-GB', 'en-CA', 'en-AU', 'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'de-DE', 'it-IT', 'pt-BR', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ru-RU', 'ar-SA', 'hi-IN', 'th-TH']).default('en-US'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM-DD-YY', 'DD-MM-YY']).default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  compactMode: z.boolean().default(false),
  defaultExportFormat: z.enum(['csv', 'json', 'pdf']).default('csv'),
  includeAnalyticsByDefault: z.boolean().default(false),
  exportDateRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  dataRetentionDays: z.number().min(30).max(3650).default(2555), // 30 days to 10 years
  allowDataAnalytics: z.boolean().default(true),
  shareUsageData: z.boolean().default(false)
})

const UpdateUserProfileSchema = UserProfileSchema.partial()

// ============================================================================
// TYPES
// ============================================================================

export type UserProfile = z.infer<typeof UserProfileSchema>
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>

export interface UserProfileWithUser {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  phone?: string
  timezone: string
  currency: string
  locale: string
  dateFormat: string
  timeFormat: string
  theme: string
  compactMode: boolean
  defaultExportFormat: string
  includeAnalyticsByDefault: boolean
  exportDateRange: string
  dataRetentionDays: number
  allowDataAnalytics: boolean
  shareUsageData: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    email: string
    name?: string
    avatarUrl?: string
  }
}

// ============================================================================
// USER PROFILE SERVICE
// ============================================================================

export class UserProfileService {
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfileWithUser | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      })

      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw new Error('Failed to fetch user profile')
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(userId: string, data: UpdateUserProfile): Promise<UserProfileWithUser> {
    try {
      // Validate input data
      const validatedData = UpdateUserProfileSchema.parse(data)

      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...validatedData,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...validatedData
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      })

      return profile
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors)
        throw new Error(`Invalid profile data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      console.error('Error upserting user profile:', error)
      throw new Error('Failed to update user profile')
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: UpdateUserProfile): Promise<UserProfileWithUser> {
    try {
      // Validate input data
      const validatedData = UpdateUserProfileSchema.parse(data)

      const profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      })

      return profile
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors)
        throw new Error(`Invalid profile data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      if (error.code === 'P2025') {
        throw new Error('User profile not found')
      }
      console.error('Error updating user profile:', error)
      throw new Error('Failed to update user profile')
    }
  }

  /**
   * Delete user profile
   */
  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      await prisma.userProfile.delete({
        where: { userId }
      })
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('User profile not found')
      }
      console.error('Error deleting user profile:', error)
      throw new Error('Failed to delete user profile')
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get user preferences for export
   */
  static async getExportPreferences(userId: string): Promise<{
    format: string
    includeAnalytics: boolean
    dateRange: string
  }> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          defaultExportFormat: true,
          includeAnalyticsByDefault: true,
          exportDateRange: true
        }
      })

      return {
        format: profile?.defaultExportFormat || 'csv',
        includeAnalytics: profile?.includeAnalyticsByDefault || false,
        dateRange: profile?.exportDateRange || '30d'
      }
    } catch (error) {
      console.error('Error fetching export preferences:', error)
      // Return defaults if error
      return {
        format: 'csv',
        includeAnalytics: false,
        dateRange: '30d'
      }
    }
  }

  /**
   * Get user display preferences
   */
  static async getDisplayPreferences(userId: string): Promise<{
    theme: string
    compactMode: boolean
    dateFormat: string
    timeFormat: string
    currency: string
    locale: string
  }> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          theme: true,
          compactMode: true,
          dateFormat: true,
          timeFormat: true,
          currency: true,
          locale: true
        }
      })

      return {
        theme: profile?.theme || 'system',
        compactMode: profile?.compactMode || false,
        dateFormat: profile?.dateFormat || 'MM/DD/YYYY',
        timeFormat: profile?.timeFormat || '12h',
        currency: profile?.currency || 'USD',
        locale: profile?.locale || 'en-US'
      }
    } catch (error) {
      console.error('Error fetching display preferences:', error)
      // Return defaults if error
      return {
        theme: 'system',
        compactMode: false,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        locale: 'en-US'
      }
    }
  }

  /**
   * Check if user allows data analytics
   */
  static async allowsDataAnalytics(userId: string): Promise<boolean> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { allowDataAnalytics: true }
      })

      return profile?.allowDataAnalytics ?? true
    } catch (error) {
      console.error('Error checking data analytics permission:', error)
      return true // Default to allowing if error
    }
  }

  /**
   * Get user's full name
   */
  static async getFullName(userId: string): Promise<string | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true }
      })

      if (!profile?.firstName && !profile?.lastName) {
        return null
      }

      return [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    } catch (error) {
      console.error('Error fetching user full name:', error)
      return null
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Get multiple user profiles (for admin purposes)
   */
  static async getMultipleUserProfiles(userIds: string[]): Promise<UserProfileWithUser[]> {
    try {
      const profiles = await prisma.userProfile.findMany({
        where: {
          userId: { in: userIds }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      })

      return profiles
    } catch (error) {
      console.error('Error fetching multiple user profiles:', error)
      throw new Error('Failed to fetch user profiles')
    }
  }

  /**
   * Get users with specific preferences
   */
  static async getUsersByPreference(preference: keyof UserProfile, value: any): Promise<UserProfileWithUser[]> {
    try {
      const profiles = await prisma.userProfile.findMany({
        where: {
          [preference]: value
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      })

      return profiles
    } catch (error) {
      console.error('Error fetching users by preference:', error)
      throw new Error('Failed to fetch users by preference')
    }
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const userProfileService = UserProfileService 