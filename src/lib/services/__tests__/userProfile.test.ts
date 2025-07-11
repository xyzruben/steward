// ============================================================================
// USER PROFILE SERVICE TESTS
// ============================================================================
// Comprehensive tests for user profile service
// See: Master System Guide - Testing and Quality Assurance

import { UserProfileService, userProfileService } from '../userProfile'
import { prisma } from '@/lib/prisma'

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockPrisma = {
  userProfile: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    upsert: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}))

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg'
}

const mockUserProfile = {
  id: 'profile-123',
  userId: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  timezone: 'America/New_York',
  currency: 'USD',
  locale: 'en-US',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  theme: 'system',
  compactMode: false,
  defaultExportFormat: 'csv',
  includeAnalyticsByDefault: false,
  exportDateRange: '30d',
  dataRetentionDays: 2555,
  allowDataAnalytics: true,
  shareUsageData: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('UserProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // CRUD OPERATIONS TESTS
  // ============================================================================

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile)

      // Act
      const result = await UserProfileService.getUserProfile('user-123')

      // Assert
      expect(result).toEqual(mockUserProfile)
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
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
    })

    it('should return null when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await UserProfileService.getUserProfile('user-123')

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(UserProfileService.getUserProfile('user-123')).rejects.toThrow('Failed to fetch user profile')
    })
  })

  describe('upsertUserProfile', () => {
    it('should create new profile when not exists', async () => {
      // Arrange
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        currency: 'EUR' as const
      }
      mockPrisma.userProfile.upsert.mockResolvedValue({
        ...mockUserProfile,
        ...profileData
      })

      // Act
      const result = await UserProfileService.upsertUserProfile('user-123', profileData)

      // Assert
      expect(result).toEqual({
        ...mockUserProfile,
        ...profileData
      })
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          ...profileData,
          updatedAt: expect.any(Date)
        },
        create: {
          userId: 'user-123',
          ...profileData
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
    })

    it('should update existing profile when exists', async () => {
      // Arrange
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith'
      }
      mockPrisma.userProfile.upsert.mockResolvedValue({
        ...mockUserProfile,
        ...profileData
      })

      // Act
      const result = await UserProfileService.upsertUserProfile('user-123', profileData)

      // Assert
      expect(result).toEqual({
        ...mockUserProfile,
        ...profileData
      })
    })

    it('should throw validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        firstName: 'A'.repeat(51), // Too long
        currency: 'INVALID' as any // Invalid currency
      }

      // Act & Assert
      await expect(UserProfileService.upsertUserProfile('user-123', invalidData)).rejects.toThrow('Invalid profile data')
    })

    it('should throw error on database error', async () => {
      // Arrange
      mockPrisma.userProfile.upsert.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(UserProfileService.upsertUserProfile('user-123', { firstName: 'John' })).rejects.toThrow('Failed to update user profile')
    })
  })

  describe('updateUserProfile', () => {
    it('should update existing profile', async () => {
      // Arrange
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith'
      }
      mockPrisma.userProfile.update.mockResolvedValue({
        ...mockUserProfile,
        ...profileData
      })

      // Act
      const result = await UserProfileService.updateUserProfile('user-123', profileData)

      // Assert
      expect(result).toEqual({
        ...mockUserProfile,
        ...profileData
      })
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          ...profileData,
          updatedAt: expect.any(Date)
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
    })

    it('should throw error when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.update.mockRejectedValue({ code: 'P2025' })

      // Act & Assert
      await expect(UserProfileService.updateUserProfile('user-123', { firstName: 'John' })).rejects.toThrow('User profile not found')
    })

    it('should throw validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        currency: 'INVALID' as any
      }

      // Act & Assert
      await expect(UserProfileService.updateUserProfile('user-123', invalidData)).rejects.toThrow('Invalid profile data')
    })
  })

  describe('deleteUserProfile', () => {
    it('should delete profile successfully', async () => {
      // Arrange
      mockPrisma.userProfile.delete.mockResolvedValue(mockUserProfile)

      // Act
      await UserProfileService.deleteUserProfile('user-123')

      // Assert
      expect(mockPrisma.userProfile.delete).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      })
    })

    it('should throw error when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.delete.mockRejectedValue({ code: 'P2025' })

      // Act & Assert
      await expect(UserProfileService.deleteUserProfile('user-123')).rejects.toThrow('User profile not found')
    })
  })

  // ============================================================================
  // UTILITY METHODS TESTS
  // ============================================================================

  describe('getExportPreferences', () => {
    it('should return export preferences when profile exists', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        defaultExportFormat: 'json',
        includeAnalyticsByDefault: true,
        exportDateRange: '90d'
      })

      // Act
      const result = await UserProfileService.getExportPreferences('user-123')

      // Assert
      expect(result).toEqual({
        format: 'json',
        includeAnalytics: true,
        dateRange: '90d'
      })
    })

    it('should return defaults when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await UserProfileService.getExportPreferences('user-123')

      // Assert
      expect(result).toEqual({
        format: 'csv',
        includeAnalytics: false,
        dateRange: '30d'
      })
    })

    it('should return defaults on error', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockRejectedValue(new Error('Database error'))

      // Act
      const result = await UserProfileService.getExportPreferences('user-123')

      // Assert
      expect(result).toEqual({
        format: 'csv',
        includeAnalytics: false,
        dateRange: '30d'
      })
    })
  })

  describe('getDisplayPreferences', () => {
    it('should return display preferences when profile exists', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        theme: 'dark',
        compactMode: true,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'EUR',
        locale: 'en-GB'
      })

      // Act
      const result = await UserProfileService.getDisplayPreferences('user-123')

      // Assert
      expect(result).toEqual({
        theme: 'dark',
        compactMode: true,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'EUR',
        locale: 'en-GB'
      })
    })

    it('should return defaults when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await UserProfileService.getDisplayPreferences('user-123')

      // Assert
      expect(result).toEqual({
        theme: 'system',
        compactMode: false,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        locale: 'en-US'
      })
    })
  })

  describe('allowsDataAnalytics', () => {
    it('should return true when analytics allowed', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        allowDataAnalytics: true
      })

      // Act
      const result = await UserProfileService.allowsDataAnalytics('user-123')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when analytics not allowed', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        allowDataAnalytics: false
      })

      // Act
      const result = await UserProfileService.allowsDataAnalytics('user-123')

      // Assert
      expect(result).toBe(false)
    })

    it('should return true as default when profile not found', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await UserProfileService.allowsDataAnalytics('user-123')

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('getFullName', () => {
    it('should return full name when both names exist', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe'
      })

      // Act
      const result = await UserProfileService.getFullName('user-123')

      // Assert
      expect(result).toBe('John Doe')
    })

    it('should return first name only when last name missing', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        firstName: 'John',
        lastName: null
      })

      // Act
      const result = await UserProfileService.getFullName('user-123')

      // Assert
      expect(result).toBe('John')
    })

    it('should return null when no names exist', async () => {
      // Arrange
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        firstName: null,
        lastName: null
      })

      // Act
      const result = await UserProfileService.getFullName('user-123')

      // Assert
      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // BULK OPERATIONS TESTS
  // ============================================================================

  describe('getMultipleUserProfiles', () => {
    it('should return multiple profiles', async () => {
      // Arrange
      const profiles = [mockUserProfile, { ...mockUserProfile, id: 'profile-456', userId: 'user-456' }]
      mockPrisma.userProfile.findMany.mockResolvedValue(profiles)

      // Act
      const result = await UserProfileService.getMultipleUserProfiles(['user-123', 'user-456'])

      // Assert
      expect(result).toEqual(profiles)
      expect(mockPrisma.userProfile.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: ['user-123', 'user-456'] }
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
    })
  })

  describe('getUsersByPreference', () => {
    it('should return users with specific preference', async () => {
      // Arrange
      const profiles = [mockUserProfile]
      mockPrisma.userProfile.findMany.mockResolvedValue(profiles)

      // Act
      const result = await UserProfileService.getUsersByPreference('currency', 'USD')

      // Assert
      expect(result).toEqual(profiles)
      expect(mockPrisma.userProfile.findMany).toHaveBeenCalledWith({
        where: {
          currency: 'USD'
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
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('validation', () => {
    it('should validate valid profile data', async () => {
      // Arrange
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        currency: 'USD' as const,
        theme: 'dark' as const,
        dataRetentionDays: 365
      }
      mockPrisma.userProfile.upsert.mockResolvedValue(mockUserProfile)

      // Act
      const result = await UserProfileService.upsertUserProfile('user-123', validData)

      // Assert
      expect(result).toBeDefined()
    })

    it('should reject invalid currency', async () => {
      // Arrange
      const invalidData = {
        currency: 'INVALID' as any
      }

      // Act & Assert
      await expect(UserProfileService.upsertUserProfile('user-123', invalidData)).rejects.toThrow('Invalid profile data')
    })

    it('should reject invalid theme', async () => {
      // Arrange
      const invalidData = {
        theme: 'INVALID' as any
      }

      // Act & Assert
      await expect(UserProfileService.upsertUserProfile('user-123', invalidData)).rejects.toThrow('Invalid profile data')
    })

    it('should reject invalid data retention days', async () => {
      // Arrange
      const invalidData = {
        dataRetentionDays: 20 // Too low
      }

      // Act & Assert
      await expect(UserProfileService.upsertUserProfile('user-123', invalidData)).rejects.toThrow('Invalid profile data')
    })
  })

  // ============================================================================
  // EXPORT TESTS
  // ============================================================================

  describe('default export', () => {
    it('should export default instance', () => {
      // Assert
      expect(userProfileService).toBe(UserProfileService)
    })
  })
}) 