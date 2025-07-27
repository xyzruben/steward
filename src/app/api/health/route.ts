// ============================================================================
// HEALTH CHECK API ROUTE
// ============================================================================
// Production health monitoring endpoint for system status
// See: Master System Guide - API Route Principles, Monitoring and Observability

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';
import { analyticsCache } from '@/lib/services/cache';

export async function GET() {
  const startTime = Date.now();
  const healthChecks = {
    database: false,
    openai: false,
    cache: false,
    overall: false,
  };

  try {
    // 1. Database Health Check
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // 2. OpenAI API Health Check
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      await openai.models.list();
      healthChecks.openai = true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
    }

    // 3. Cache Health Check
    try {
      await analyticsCache.set('health_check', 'ok', { ttl: 60 * 1000 });
      const cacheResult = await analyticsCache.get('health_check');
      healthChecks.cache = cacheResult === 'ok';
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    // 4. Overall Health Status
    healthChecks.overall = healthChecks.database && healthChecks.openai && healthChecks.cache;

    const responseTime = Date.now() - startTime;

    // 5. Return Health Status
    if (healthChecks.overall) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        services: {
          database: healthChecks.database ? 'healthy' : 'unhealthy',
          openai: healthChecks.openai ? 'healthy' : 'unhealthy',
          cache: healthChecks.cache ? 'healthy' : 'unhealthy',
        },
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    } else {
      return NextResponse.json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        services: {
          database: healthChecks.database ? 'healthy' : 'unhealthy',
          openai: healthChecks.openai ? 'healthy' : 'unhealthy',
          cache: healthChecks.cache ? 'healthy' : 'unhealthy',
        },
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check failed:', error);
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