import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================================
// NEXT.JS MIDDLEWARE - ENHANCED SECURITY
// ============================================================================
// Handles Supabase authentication and session management
// Adds comprehensive security headers for protection against XSS, CSRF, and other attacks
// Refreshes user sessions and manages auth cookies

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options?: { [key: string]: unknown }) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options?: { [key: string]: unknown }) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-user-with-client-components
  await supabase.auth.getUser()

  // ============================================================================
  // SECURITY HEADERS (see security audit report)
  // ============================================================================
  
  // Prevent clickjacking attacks
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Control referrer information
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Control browser features
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy - comprehensive protection against XSS
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://*.supabase.co https://*.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ]
  
  supabaseResponse.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Additional security headers
  supabaseResponse.headers.set('X-DNS-Prefetch-Control', 'off')
  supabaseResponse.headers.set('X-Download-Options', 'noopen')
  supabaseResponse.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 