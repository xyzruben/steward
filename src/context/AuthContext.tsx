'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (!error && session) {
      setSession(session)
      setUser(session.user)
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Sync user to Prisma database when user exists
        if (session?.user) {
          try {
            await fetch('/api/auth/sync-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
              }),
            })
          } catch (error) {
            console.error('Failed to sync user to database:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  }

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