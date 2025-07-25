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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null; success?: boolean }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>
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

  // Initialize Supabase client only on client side
  useEffect(() => {
    setSupabase(createSupabaseBrowserClient())
  }, [])

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (!error && data.user && !data.session) {
      // User created but needs email confirmation
      return { error: null, success: true }
    }
    
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    // Redirect to homepage after logout
    window.location.href = '/'
  }

  const refreshSession = async () => {
    if (!supabase) return
    const { data: { session }, error } = await supabase.auth.getSession()
    if (!error && session) {
      setSession(session)
      setUser(session.user)
    }
  }

  const resendConfirmation = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase client not initialized') }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  useEffect(() => {
    if (!supabase) return

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes (optimized for performance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: SupabaseAuthEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        // User sync moved to lazy loading - only syncs when user data is accessed
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
    signIn,
    signUp,
    signOut,
    refreshSession,
    resendConfirmation,
  }), [user, session, loading])

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