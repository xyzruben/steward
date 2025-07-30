// ============================================================================
// ENHANCED MIDDLEWARE - AI-First Architecture Optimized
// ============================================================================
// Optimized middleware with authentication checks and performance monitoring
// Focuses on AI agent performance with minimal overhead

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Skip middleware for static files and API routes that handle their own auth
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/api/agent') ||
      request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  // Authentication check for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/receipts') ||
      request.nextUrl.pathname.startsWith('/profile')) {
    
    try {
      // Check for auth cookie directly in middleware
      const authCookie = request.cookies.get('sb-access-token');
      if (!authCookie?.value) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Middleware authentication error:', error);
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Add performance headers
  const response = NextResponse.next();
  const executionTime = Date.now() - startTime;
  
  response.headers.set('X-Middleware-Time', executionTime.toString());
  response.headers.set('X-Middleware-Cache', 'no-cache');
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/receipts/:path*',
    '/profile/:path*',
    '/api/:path*'
  ]
}; 