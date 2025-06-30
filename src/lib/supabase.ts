import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// ============================================================================
// SUPABASE CLIENT UTILITIES
// ============================================================================
// Provides type-safe Supabase clients for both browser and server environments
// Following Next.js 15 App Router and Supabase SSR best practices

export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const createSupabaseServerClient = (
  cookies: ReadonlyRequestCookies
) =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key: string) => {
          const cookie = cookies.get(key)
          return cookie?.value
        },
        set: (key: string, value: string, options?: CookieOptions) => {
          try {
            cookies.set(key, value, options)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove: (key: string, options?: CookieOptions) => {
          try {
            cookies.set(key, '', { ...options, maxAge: 0 })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

// ============================================================================
// TYPE EXPORTS
// ============================================================================
// Re-export Supabase types for use throughout the application

export type { User as SupabaseUser } from '@supabase/supabase-js'
export type { Session } from '@supabase/supabase-js' 