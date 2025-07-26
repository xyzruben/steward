# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the Steward AI Financial Assistant platform. The deployment follows enterprise-grade practices with proper monitoring, security, and performance optimization.

## Pre-Deployment Checklist

### ✅ Environment Configuration

#### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional - Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

#### Environment Validation
```bash
# Validate environment variables
npm run validate:env

# Test database connection
npm run test:db

# Verify OpenAI API access
npm run test:openai
```

### ✅ Security Audit

#### Security Checklist
- [ ] Environment variables properly configured
- [ ] Database connection secured
- [ ] API keys rotated and secured
- [ ] Authentication flows tested
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Input validation implemented
- [ ] Error handling sanitized

#### Security Testing
```bash
# Run security audit
npm audit

# Test authentication flows
npm run test:auth

# Validate API security
npm run test:security
```

### ✅ Performance Validation

#### Performance Testing
```bash
# Run performance tests
npm run test:performance

# Load testing
npm run test:load

# Database performance
npm run test:db:performance
```

#### Performance Benchmarks
- **API Response Time**: < 2 seconds for AI queries
- **Database Query Time**: < 500ms for standard queries
- **Cache Hit Rate**: > 80% for common queries
- **Memory Usage**: < 512MB per instance
- **CPU Usage**: < 70% under normal load

## Deployment Architecture

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Vercel/Cloud  │  │   Load Balancer │  │   CDN        │ │
│  │   Deployment    │  │   (Auto-scaling)│  │   (Static)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                              │                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Supabase      │  │   OpenAI API    │  │   Monitoring │ │
│  │   (Database)    │  │   (AI Services) │  │   (Sentry)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Strategy

#### Blue-Green Deployment
1. **Blue Environment**: Current production
2. **Green Environment**: New deployment
3. **Traffic Switch**: Gradual traffic migration
4. **Rollback**: Quick rollback to blue if issues

#### Canary Deployment
1. **Initial Release**: 5% of traffic to new version
2. **Monitoring**: Monitor metrics and errors
3. **Gradual Increase**: Increase traffic to 25%, 50%, 100%
4. **Full Deployment**: Complete migration

## Deployment Process

### Step 1: Production Environment Setup

#### 1.1 Database Migration
```bash
# Generate production migration
npx prisma migrate dev --name production_deployment

# Deploy to production database
npx prisma migrate deploy

# Verify database schema
npx prisma db pull
```

#### 1.2 Environment Configuration
```bash
# Set production environment variables
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

#### 1.3 Build Optimization
```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze

# Optimize images and assets
npm run optimize
```

### Step 2: Monitoring Setup

#### 2.1 Application Monitoring
```typescript
// src/lib/monitoring/production.ts
import * as Sentry from '@sentry/nextjs';

export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
  });
}
```

#### 2.2 Health Check Endpoints
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    
    // OpenAI health check
    const openai = new OpenAI();
    await openai.models.list();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        openai: 'healthy',
        cache: 'healthy'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

#### 2.3 Performance Monitoring
```typescript
// src/lib/monitoring/performance.ts
export function trackPerformance(operation: string, duration: number) {
  // Send to monitoring service
  console.log(`Performance: ${operation} took ${duration}ms`);
  
  // Alert if performance degrades
  if (duration > 5000) {
    sendAlert(`Performance degradation: ${operation} took ${duration}ms`);
  }
}
```

### Step 3: Security Configuration

#### 3.1 Rate Limiting
```typescript
// src/lib/rate-limiter.ts
import { rateLimit } from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiQueryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 AI queries per minute
  message: 'Too many AI queries, please wait',
});
```

#### 3.2 Input Validation
```typescript
// src/lib/validation/ai-query.ts
import { z } from 'zod';

export const aiQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  streaming: z.boolean().optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

export function validateAIQuery(data: unknown) {
  return aiQuerySchema.parse(data);
}
```

### Step 4: Deployment Execution

#### 4.1 Pre-Deployment Tests
```bash
# Run full test suite
npm test

# Run production build test
npm run build

# Run security audit
npm audit

# Run performance tests
npm run test:performance
```

#### 4.2 Database Backup
```bash
# Create production backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list backup_*.sql
```

#### 4.3 Deployment Commands
```bash
# Deploy to production
vercel --prod

# Or using Vercel CLI
vercel deploy --prod

# Verify deployment
curl https://your-domain.com/api/health
```

### Step 5: Post-Deployment Validation

#### 5.1 Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connectivity
curl https://your-domain.com/api/health/db

# Check AI service connectivity
curl https://your-domain.com/api/health/ai
```

#### 5.2 Functional Testing
```bash
# Test AI agent functionality
curl -X POST https://your-domain.com/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How much did I spend last month?"}'

# Test monitoring endpoints
curl https://your-domain.com/api/monitoring/agent-metrics
```

#### 5.3 Performance Validation
```bash
# Run performance tests against production
npm run test:performance:prod

# Monitor response times
curl -w "@curl-format.txt" https://your-domain.com/api/agent/query
```

## Monitoring and Alerting

### Production Monitoring Dashboard

#### Key Metrics to Monitor
- **Response Time**: API response times
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second
- **Cache Hit Rate**: Cache effectiveness
- **Database Performance**: Query times and connections
- **AI Service Health**: OpenAI API status

#### Alerting Rules
```yaml
# alerts.yml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    
  - name: "Slow Response Time"
    condition: "response_time > 5s"
    duration: "2m"
    
  - name: "Database Issues"
    condition: "db_connection_failed"
    duration: "1m"
    
  - name: "AI Service Down"
    condition: "openai_api_error"
    duration: "1m"
```

### Log Management

#### Structured Logging
```typescript
// src/lib/logging/production.ts
export function logProductionEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, any>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    environment: 'production',
    version: process.env.APP_VERSION,
  };
  
  console.log(JSON.stringify(logEntry));
}
```

#### Log Aggregation
- **Application Logs**: Sent to centralized logging service
- **Error Logs**: Sent to Sentry for error tracking
- **Performance Logs**: Sent to monitoring dashboard
- **Access Logs**: Sent to security monitoring

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-id>

# Verify rollback
curl https://your-domain.com/api/health
```

### Database Rollback
```bash
# Restore from backup if needed
pg_restore -d $DATABASE_URL backup_*.sql

# Verify data integrity
npm run test:db:integrity
```

### Emergency Procedures
1. **Immediate Rollback**: If critical issues detected
2. **Traffic Reduction**: Reduce traffic to new deployment
3. **Investigation**: Analyze logs and metrics
4. **Fix and Redeploy**: Address issues and redeploy

## Performance Optimization

### Production Optimizations

#### 1. Caching Strategy
```typescript
// Enhanced caching for production
export const productionCache = {
  // AI query results: 1 hour
  aiQueries: 3600,
  
  // Analytics data: 30 minutes
  analytics: 1800,
  
  // User data: 15 minutes
  userData: 900,
  
  // Static data: 24 hours
  staticData: 86400,
};
```

#### 2. Database Optimization
```sql
-- Production database indexes
CREATE INDEX CONCURRENTLY idx_receipts_user_date 
ON receipts(user_id, date);

CREATE INDEX CONCURRENTLY idx_receipts_category 
ON receipts(user_id, category);

CREATE INDEX CONCURRENTLY idx_agent_logs_timestamp 
ON agent_logs(timestamp);
```

#### 3. API Optimization
```typescript
// Response compression
export const compressionConfig = {
  threshold: 1024,
  level: 6,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
};
```

## Security Hardening

### Production Security Measures

#### 1. API Security
```typescript
// Enhanced security middleware
export const securityMiddleware = [
  helmet(),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
];
```

#### 2. Data Protection
```typescript
// Data encryption at rest
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}
```

#### 3. Access Control
```typescript
// Enhanced authentication
export async function validateUserAccess(
  userId: string,
  resourceId: string
): Promise<boolean> {
  // Check user permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: true },
  });
  
  return user?.permissions.some(p => p.resourceId === resourceId) ?? false;
}
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- [ ] Monitor error rates and performance
- [ ] Check database performance
- [ ] Review security alerts
- [ ] Verify backup completion

#### Weekly
- [ ] Review performance metrics
- [ ] Update dependencies
- [ ] Analyze usage patterns
- [ ] Review security logs

#### Monthly
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Capacity planning
- [ ] Backup restoration test

### Update Procedures

#### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updates
npm test

# Deploy updates
vercel --prod
```

#### Database Updates
```bash
# Create migration
npx prisma migrate dev --name update_name

# Deploy migration
npx prisma migrate deploy

# Verify migration
npx prisma db pull
```

## Troubleshooting

### Common Production Issues

#### 1. High Response Times
- **Check**: Database query performance
- **Check**: Cache hit rates
- **Check**: AI service response times
- **Solution**: Optimize queries, increase cache, scale resources

#### 2. High Error Rates
- **Check**: Application logs
- **Check**: Database connectivity
- **Check**: External service status
- **Solution**: Fix code issues, check dependencies

#### 3. Memory Issues
- **Check**: Memory usage patterns
- **Check**: Memory leaks
- **Check**: Cache memory usage
- **Solution**: Optimize memory usage, increase resources

#### 4. Database Issues
- **Check**: Connection pool status
- **Check**: Query performance
- **Check**: Database load
- **Solution**: Optimize queries, scale database

### Emergency Contacts

#### Escalation Matrix
1. **Level 1**: On-call developer (immediate response)
2. **Level 2**: Senior developer (within 30 minutes)
3. **Level 3**: Engineering lead (within 1 hour)
4. **Level 4**: CTO/VP Engineering (within 2 hours)

#### Contact Information
- **On-call**: [On-call developer contact]
- **Senior Developer**: [Senior developer contact]
- **Engineering Lead**: [Engineering lead contact]
- **CTO**: [CTO contact]

---

This production deployment guide ensures a robust, secure, and performant deployment of the Steward AI Financial Assistant platform. Follow these procedures carefully to maintain high availability and user satisfaction. 