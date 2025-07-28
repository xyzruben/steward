'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { SupabaseAuthEvent } from '@/types/supabase'

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null; success?: boolean }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>
  checkAuthStatus: () => Promise<boolean>
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null)

  // Computed authentication state
  const isAuthenticated = useMemo(() => {
    return !!(user && session && (!session.expires_at || new Date(session.expires_at * 1000) > new Date()))
  }, [user, session])

  // Initialize Supabase client only on client side
  useEffect(() => {
    setSupabase(createSupabaseBrowserClient())
  }, [])

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.user)
      }
      
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') }
    }
  }

  // Helper function to get the correct redirect URL for email confirmation
  const getEmailRedirectUrl = () => {
    // Use environment variable if available (production), otherwise use window.location.origin (development)
    return process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      })
      
      if (!error && data.user && !data.session) {
        // User created but needs email confirmation
        return { error: null, success: true }
      }
      
      if (!error && data.session) {
        setSession(data.session)
        setUser(data.user)
      }
      
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      // Redirect to homepage after logout
      window.location.href = '/'
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const refreshSession = async () => {
    if (!supabase) return
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session) {
        setSession(session)
        setUser(session.user)
      } else if (error) {
        console.error('Session refresh error:', error)
        setSession(null)
        setUser(null)
      }
    } catch (err) {
      console.error('Session refresh failed:', err)
      setSession(null)
      setUser(null)
    }
  }

  const checkAuthStatus = async (): Promise<boolean> => {
    if (!supabase) return false
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session && session.user) {
        setSession(session)
        setUser(session.user)
        return true
      } else {
        setSession(null)
        setUser(null)
        return false
      }
    } catch (err) {
      console.error('Auth status check failed:', err)
      setSession(null)
      setUser(null)
      return false
    }
  }

  const resendConfirmation = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      })
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Resend confirmation failed') }
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  useEffect(() => {
    if (!supabase) return

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!error && session) {
          setSession(session)
          setUser(session.user)
        } else if (error) {
          console.error('Initial session error:', error)
        }
      } catch (err) {
        console.error('Initial session failed:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes (optimized for performance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: SupabaseAuthEvent, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // ============================================================================
  // CONTEXT VALUE (Memoized for performance)
  // ============================================================================

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refreshSession,
    resendConfirmation,
    checkAuthStatus,
  }), [user, session, loading, isAuthenticated, signIn, signUp, signOut, refreshSession, resendConfirmation, checkAuthStatus])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// AUTH HOOK
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 