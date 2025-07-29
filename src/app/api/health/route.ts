// ============================================================================
// HEALTH CHECK API ROUTE - Simplified for AI-First Architecture
// ============================================================================
// Basic health monitoring endpoint without complex analytics overhead

import { NextResponse } from 'next/server';
import { healthService } from '@/lib/services/health';
import { logger } from '@/lib/services/logger';

export async function GET() {
  try {
    const healthStatus = await healthService.checkSystemHealth();
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 
                      healthStatus.overall === 'degraded' ? 200 : 503;
    
    return NextResponse.json({
      status: healthStatus.overall,
      timestamp: healthStatus.timestamp,
      responseTime: `${healthStatus.responseTime}ms`,
      services: healthStatus.checks,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        database: 'unknown',
        openai: 'unknown',
        cache: 'unknown',
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, { status: 503 });
  }
} 