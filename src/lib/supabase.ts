import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// ============================================================================
// SUPABASE CLIENT UTILITIES
// ============================================================================
// Provides type-safe Supabase clients for both browser and server environments
// Following Next.js 15 App Router and Supabase SSR best practices

export const createSupabaseBrowserClient = () => {
  // Check if we're in a build environment (no environment variables available)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // During build time, return a mock client to prevent build errors
    return {} as any
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return createBrowserClient(url, key)
}

// Alias for backward compatibility
export const createSupabaseClient = createSupabaseBrowserClient

export const createSupabaseServerClient = (
  cookies?: ReadonlyRequestCookies
) => {
  // Check if we're in a build environment (no environment variables available)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // During build time, return a mock client to prevent build errors
    return {} as any
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return createServerClient(url, key, {
    cookies: {
      get: (key: string) => {
        if (!cookies) return undefined
        const cookie = cookies.get(key)
        return cookie?.value
      },
      set: (key: string, value: string, options?: CookieOptions) => {
        try {
          if (cookies) {
            cookies.set(key, value, options)
          }
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove: (key: string, options?: CookieOptions) => {
        try {
          if (cookies) {
            cookies.set(key, '', { ...options, maxAge: 0 })
          }
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
// Re-export Supabase types for use throughout the application

export type { User as SupabaseUser } from '@supabase/supabase-js'
export type { Session } from '@supabase/supabase-js' 