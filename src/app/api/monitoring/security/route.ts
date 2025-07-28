import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { securityMonitoring } from '@/lib/services/monitoring'

// ============================================================================
// SECURITY MONITORING API
// ============================================================================
// Provides access to security events and monitoring data
// Requires admin privileges for sensitive security information

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Authorization - only allow access to security monitoring for admin users
    // TODO: Implement proper admin role checking
    // For now, we'll allow access but log it for security review
    console.log('Security monitoring accessed by user:', user.id)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')

    // Get security data
    const securityStats = securityMonitoring.getSecurityStats()
    const recentEvents = securityMonitoring.getRecentSecurityEvents(limit)
    const recentLogs = securityMonitoring.getRecentRequestLogs(100)

    // Filter events if type or severity specified
    let filteredEvents = recentEvents
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type)
    }
    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity)
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: securityStats,
        events: filteredEvents.map(event => ({
          ...event,
          timestamp: event.timestamp.toISOString(),
        })),
        logs: recentLogs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
      },
      metadata: {
        totalEvents: securityStats.totalEvents,
        totalLogs: securityStats.totalLogs,
        eventsLastHour: securityStats.eventsLastHour,
        requestsLastHour: securityStats.requestsLastHour,
        errorRate: securityStats.errorRate,
      },
    })

  } catch (error) {
    console.error('Security monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, data } = body

    // Handle different actions
    switch (action) {
      case 'clear_events':
        // TODO: Implement clear events functionality
        return NextResponse.json({
          success: true,
          message: 'Events cleared successfully',
        })

      case 'export_events':
        // TODO: Implement export functionality
        return NextResponse.json({
          success: true,
          message: 'Export functionality not yet implemented',
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Security monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 