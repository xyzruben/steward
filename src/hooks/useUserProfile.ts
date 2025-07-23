// ============================================================================
// USER PROFILE HOOK
// ============================================================================
// React hook for managing user profile and preferences
// See: Master System Guide - State Management, Frontend Architecture

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import type { UserProfile, UpdateUserProfile, UserProfileWithUser } from '@/lib/services/userProfile'
import { LazyUserSyncService } from '@/lib/services/userProfile'
import type { SupabaseAuthEvent } from '@/types/supabase'
import type { Session } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
  export: {
    format: string
    includeAnalytics: boolean
    dateRange: string
  }
  display: {
    theme: string
    compactMode: boolean
    dateFormat: string
    timeFormat: string
    currency: string
    locale: string
  }
  analytics: {
    allowsDataAnalytics: boolean
  }
}

export interface UseUserProfileReturn {
  // Profile data
  profile: UserProfileWithUser | null
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
  
  // Actions
  updateProfile: (data: UpdateUserProfile) => Promise<void>
  updatePreferences: (type: 'export' | 'display' | 'analytics', data: any) => Promise<void>
  refreshProfile: () => Promise<void>
  
  // Utility getters
  getFullName: () => string | null
  getDisplayPreferences: () => UserPreferences['display'] | null
  getExportPreferences: () => UserPreferences['export'] | null
  allowsDataAnalytics: () => boolean
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const profileCache = new Map<string, { data: UserProfileWithUser; timestamp: number }>()
const preferencesCache = new Map<string, { data: UserPreferences; timestamp: number }>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedProfile(userId: string): UserProfileWithUser | null {
  const cached = profileCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedProfile(userId: string, data: UserProfileWithUser): void {
  profileCache.set(userId, { data, timestamp: Date.now() })
}

function getCachedPreferences(userId: string): UserPreferences | null {
  const cached = preferencesCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedPreferences(userId: string, data: UserPreferences): void {
  preferencesCache.set(userId, { data, timestamp: Date.now() })
}

function clearCache(userId: string): void {
  profileCache.delete(userId)
  preferencesCache.delete(userId)
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchProfile(userId: string): Promise<UserProfileWithUser> {
  const response = await fetch('/api/profile')
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`)
  }
  return response.json()
}

async function updateProfile(userId: string, data: UpdateUserProfile): Promise<UserProfileWithUser> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`)
  }
  return response.json()
}

async function fetchPreferences(userId: string): Promise<UserPreferences> {
  const response = await fetch('/api/profile/preferences')
  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.statusText}`)
  }
  return response.json()
}

async function updatePreferences(userId: string, type: string, data: any): Promise<UserProfileWithUser> {
  const response = await fetch(`/api/profile/preferences?type=${type}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`Failed to update preferences: ${response.statusText}`)
  }
  return response.json()
}

// ============================================================================
// USER PROFILE HOOK
// ============================================================================

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfileWithUser | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // ============================================================================
  // AUTHENTICATION SETUP
  // ============================================================================

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    // Get initial user
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: SupabaseAuthEvent, session: Session | null) => {
        if (session?.user) {
          setUserId(session.user.id)
          // Clear cache when user changes
          if (userId && userId !== session.user.id) {
            clearCache(userId)
          }
        } else {
          setUserId(null)
          setProfile(null)
          setPreferences(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [userId])

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchProfileData = useCallback(async (uid: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const cachedProfile = getCachedProfile(uid)
      const cachedPreferences = getCachedPreferences(uid)

      if (cachedProfile && cachedPreferences) {
        setProfile(cachedProfile)
        setPreferences(cachedPreferences)
        setIsLoading(false)
        return
      }

      // Lazy sync user if needed before fetching data
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await LazyUserSyncService.lazySyncUser(user.id, user.email!)
        } catch (error) {
          console.warn('Lazy sync failed, continuing with profile fetch:', error)
        }
      }

      // Fetch fresh data
      const [profileData, preferencesData] = await Promise.all([
        fetchProfile(uid),
        fetchPreferences(uid)
      ])

      // Update cache and state
      setCachedProfile(uid, profileData)
      setCachedPreferences(uid, preferencesData)
      setProfile(profileData)
      setPreferences(preferencesData)

    } catch (err) {
      console.error('Error fetching profile data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchProfileData(userId)
    }
  }, [userId, fetchProfileData])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const updateProfileAction = useCallback(async (data: UpdateUserProfile) => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      const updatedProfile = await updateProfile(userId, data)
      
      // Update cache and state
      setCachedProfile(userId, updatedProfile)
      setProfile(updatedProfile)

      // Update preferences if they were included
      if (data.theme || data.currency || data.locale || data.dateFormat || data.timeFormat || data.compactMode) {
        const updatedPreferences = await fetchPreferences(userId)
        setCachedPreferences(userId, updatedPreferences)
        setPreferences(updatedPreferences)
      }

    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    }
  }, [userId])

  const updatePreferencesAction = useCallback(async (type: 'export' | 'display' | 'analytics', data: any) => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    try {
      setError(null)
      const updatedProfile = await updatePreferences(userId, type, data)
      
      // Update cache and state
      setCachedProfile(userId, updatedProfile)
      setProfile(updatedProfile)

      // Refresh preferences
      const updatedPreferences = await fetchPreferences(userId)
      setCachedPreferences(userId, updatedPreferences)
      setPreferences(updatedPreferences)

    } catch (err) {
      console.error('Error updating preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      throw err
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Clear cache and refetch
    clearCache(userId)
    await fetchProfileData(userId)
  }, [userId, fetchProfileData])

  // ============================================================================
  // UTILITY GETTERS
  // ============================================================================

  const getFullName = useCallback((): string | null => {
    if (!profile) return null
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null
  }, [profile])

  const getDisplayPreferences = useCallback((): UserPreferences['display'] | null => {
    return preferences?.display || null
  }, [preferences])

  const getExportPreferences = useCallback((): UserPreferences['export'] | null => {
    return preferences?.export || null
  }, [preferences])

  const allowsDataAnalytics = useCallback((): boolean => {
    return preferences?.analytics?.allowsDataAnalytics ?? true
  }, [preferences])

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return useMemo(() => ({
    profile,
    preferences,
    isLoading,
    error,
    updateProfile: updateProfileAction,
    updatePreferences: updatePreferencesAction,
    refreshProfile,
    getFullName,
    getDisplayPreferences,
    getExportPreferences,
    allowsDataAnalytics
  }), [
    profile,
    preferences,
    isLoading,
    error,
    updateProfileAction,
    updatePreferencesAction,
    refreshProfile,
    getFullName,
    getDisplayPreferences,
    getExportPreferences,
    allowsDataAnalytics
  ])
} 