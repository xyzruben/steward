# Support Playbook - Steward Receipt Management System

> Technical support documentation for the Steward receipt management application.
> **Tech Stack:** Next.js 15, React 19, TypeScript, Prisma ORM, PostgreSQL (Supabase)

---

## How to Handle Common Issues

### Issue: API errors / failed requests

**Common Error Types:**
- `VALIDATION_ERROR` (400): Invalid input, file size/type violations
- `UNAUTHORIZED` (401): Missing or expired JWT token
- `FORBIDDEN` (403): Access denied, insufficient permissions
- `RATE_LIMIT_EXCEEDED` (429): Rate limit hit on endpoint
- `AI_PROCESSING_FAILED` (500): OpenAI API timeout or error
- `DATABASE_ERROR` (500): PostgreSQL connection or query failure
- `EXTERNAL_SERVICE_FAILURE` (503): Google Cloud Vision or Supabase unavailable

**Check:**
1. **Logs** - Review sanitized logs in `/src/lib/services/logger.ts`
   - Search for Request ID (format: `err_[timestamp]_[random]`)
   - Check error severity: `low`, `medium`, `high`, `critical`
   - Review sanitized context (userId, endpoint, IP address)

2. **Retry Logic** - Manual retry endpoint available:
   ```bash
   POST /api/receipts/retry-processing
   ```
   - Use for stuck receipts (merchant = "Processing...")
   - Re-runs OCR and AI extraction
   - Non-blocking, continues on individual failures

3. **Downstream API Status** - Health check endpoint:
   ```bash
   GET /api/health
   ```
   Returns status for 4 critical services:
   - **Database** (PostgreSQL via Supabase)
   - **Storage** (Supabase Storage)
   - **OCR** (Google Cloud Vision API)
   - **AI** (OpenAI GPT-4o-mini)

**Rate Limits:**
- Receipt Upload: 10 requests per 15 minutes
- AI Processing: 20 requests per 1 minute
- Authentication: 5 attempts per 15 minutes
- Search: 30 requests per 1 minute
- General API: 100 requests per 1 minute

**Recovery Steps:**
1. Check health endpoint (`/api/health`) to identify failing service
2. Review error logs for Request ID correlation
3. If rate limited, wait for window reset (see limits above)
4. For stuck receipts, use retry-processing endpoint
5. Verify environment variables if external APIs failing (see Environment section)

---

### Issue: Authentication fails

**Symptoms:**
- 401 Unauthorized responses
- Redirect to login page on protected routes
- "Invalid token" or "Session expired" errors
- OAuth callback failures (`/auth/auth-code-error`)

**Check:**

1. **Token Expiry**
   - JWT session duration: 7 days (configurable in Supabase)
   - Stored in secure HTTP-only cookies
   - Cookie config: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`

2. **Session Store**
   - Location: Supabase Auth backend
   - Client: `/src/lib/supabase.ts` (server and browser clients)
   - Middleware validation: `/src/middleware.ts`

3. **User Config**
   - Verify user exists in Supabase Auth dashboard
   - Check email verification status
   - Review user roles/permissions

**Protected Routes:**
- `/dashboard/*`
- `/receipts/*`
- `/profile/*`
- `/api/*` (most endpoints, except health/debug)

**Excluded from Auth:**
- `/_next/*` (static files)
- `/api/agent/*` (AI agent has custom auth)
- `/api/health/*` (health checks)
- `/api/debug/*` (debug endpoints in development)

**Recovery Steps:**
1. Clear browser cookies and localStorage
2. Re-login via Supabase Auth flow
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
4. Check Supabase project status (dashboard.supabase.com)
5. Review middleware logs for authentication failures
6. If OAuth callback fails, verify redirect URLs in Supabase Auth settings

---

### Issue: System slowdown

**Performance Bottlenecks:**

1. **Database Performance**
   - **Connection Pool:** Max 10 connections (Supabase limit)
   - **Query Timeout:** 30 seconds
   - **Common Issues:**
     - Pool exhaustion (active queries > 10)
     - Slow queries on large datasets
     - Missing index utilization

   **Check:**
   - Review Prisma query performance in `/src/lib/db.ts`
   - Verify database indexes are being used:
     ```sql
     -- Key indexes for performance
     @@index([userId, purchaseDate])
     @@index([userId, category])
     @@index([isDuplicate])
     ```
   - Monitor connection count in Supabase dashboard
   - Check for N+1 query patterns

2. **Cache Behavior**
   - **Implementation:** In-memory cache (`/src/lib/services/cache.ts`)
   - **Cache TTLs:**
     - Receipt lists: 5 minutes
     - Statistics: 10 minutes
     - Search results: 3 minutes
     - AI agent responses: In-memory

   **Check:**
   - Verify cache hit rates
   - Clear cache if stale data suspected
   - Monitor memory usage for cache size

3. **Timeouts**
   - Receipt fetch: 30 seconds
   - OCR processing: 60 seconds
   - AI extraction: 30 seconds
   - Database queries: 30 seconds
   - Middleware execution: Tracked via `X-Middleware-Time` header

**Optimization Strategies:**
- Enable pagination for large datasets (`getReceiptsWithPagination`)
- Use indexed queries (userId + date range most efficient)
- Filter out duplicates by default (`isDuplicate: false`)
- Monitor OCR/AI processing times (logged in performance metrics)
- Scale Supabase plan if connection pool consistently exhausted

---

### Issue: Receipt upload failing

**Common Causes:**

1. **File Validation Failures**
   - Max file size: 10 MB
   - Allowed formats: JPEG, PNG, HEIC, WebP, PDF
   - File signature validation (not just MIME type)
   - Error: `FILE_TOO_LARGE` or `INVALID_FILE_TYPE`

2. **Rate Limiting**
   - Upload limit: 10 per 15 minutes per user
   - Error: `RATE_LIMIT_EXCEEDED`
   - Recovery: Wait for window reset

3. **Storage Failures**
   - Supabase Storage bucket: `receipts`
   - Network connectivity issues
   - Storage quota exceeded
   - Error: `STORAGE_ERROR`

4. **OCR Processing Failures**
   - Google Cloud Vision API unavailable
   - Invalid credentials or quota exceeded
   - Fallback OCR automatically used if Vision fails
   - Check: `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable

5. **AI Extraction Failures**
   - OpenAI API rate limit (20 per minute)
   - API key invalid or quota exceeded
   - Error: `AI_RATE_LIMIT` or `AI_PROCESSING_FAILED`
   - Check: `OPENAI_API_KEY` environment variable

**Troubleshooting Steps:**
1. Check file meets requirements (size, format)
2. Verify user hasn't hit rate limit (10/15min)
3. Test health endpoint: `GET /api/health` - check OCR and AI services
4. Review logs for specific error codes
5. Use retry endpoint if receipt stuck: `POST /api/receipts/retry-processing`
6. Verify environment variables are set correctly

---

### Issue: Duplicate receipts showing in statistics

**Background:**
- Duplicate detection system implemented (8-phase complete)
- Location: `/src/lib/services/duplicateDetection.ts`
- Confidence scoring algorithm with 0.80 threshold

**Confidence Score Calculation:**
```
Total Confidence =
  (Merchant Match × 0.40) +
  (Total Match × 0.30) +
  (Date Match × 0.20) +
  (Text Similarity × 0.10)
```

**Detection Criteria:**
- **Merchant:** Exact match after normalization (lowercase, remove special chars)
- **Total:** Within $0.01 tolerance
- **Date:** Same day (Year/Month/Day match)
- **Text:** Dice coefficient similarity

**Resolution:**

1. **Automatic Detection:**
   - Runs on upload for new receipts
   - Threshold: 0.80 confidence
   - Auto-mark threshold: 0.90 confidence

2. **Manual Batch Detection:**
   ```bash
   POST /api/receipts/duplicates/detect
   Body: {
     "autoMark": true,
     "confidenceThreshold": 0.80,
     "dateRange": { "start": "2025-01-01", "end": "2025-12-31" }
   }
   ```

3. **Database Fields:**
   - `isDuplicate`: Boolean flag (default: false)
   - `duplicateOf`: UUID of original receipt
   - `duplicateConfidence`: Decimal (0.00-1.00)

**Verification:**
- Check receipt stats exclude duplicates: `isDuplicate: false` filter
- Run batch detection with `autoMark: true` to fix historical data
- Review confidence scores in database for edge cases

---

## How to Reproduce Bugs

### 1. Describe Expected Behavior
- Reference user stories or acceptance criteria
- Compare against production behavior
- Document API response expectations

### 2. Capture Error Message
- **Request ID:** Format `err_[timestamp]_[random]` - use for log correlation
- **HTTP Status Code:** 400, 401, 403, 429, 500, 503
- **Error Type:** From `/src/lib/services/errorHandler.ts`
- **Sanitized Message:** User-facing error (PII removed)
- **Stack Trace:** Available in logs (internal only, not exposed to users)

### 3. Log Environment Context
**Required Context:**
- Node Environment: `development` | `production`
- Next.js Version: 15.5.7
- React Version: 19.0.0
- Database: PostgreSQL (Prisma 6.10.1)
- Browser & Version (for frontend issues)
- User ID (partially redacted in logs: `abc123de***`)

**Environment Variables to Check:**
```bash
# Critical (must have)
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY

# Production required
GOOGLE_APPLICATION_CREDENTIALS_JSON
NEXT_PUBLIC_APP_URL

# Development optional
GOOGLE_APPLICATION_CREDENTIALS
```

### 4. Reproduce Locally
**Local Setup:**
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed

# Start dev server
npm run dev
```

**Test Scripts:**
```bash
npm run test              # Run all tests
npm run test:coverage     # Coverage report
npm run validate:foundation:local  # Health check validation
npm run db:test           # Database connection test
```

### 5. Isolate Failure Component
**Component Hierarchy:**
1. **Frontend** → `/src/app`, `/src/components`
2. **API Routes** → `/src/app/api/*/route.ts`
3. **Services** → `/src/lib/services/`
4. **Database** → `/src/lib/db.ts`, Prisma schema
5. **External APIs** → OpenAI, Google Cloud Vision, Supabase

**Isolation Strategy:**
- Test health endpoint to identify failing service
- Use API test endpoints in `/api/debug/*` (development only)
- Review service-specific logs (openai.ts, cloudOcr.ts, etc.)
- Check middleware logs for authentication/routing issues

---

## Incident Response Checklist

### Phase 1: Identify Failure Source
- [ ] Check health endpoint (`GET /api/health`) for service status
- [ ] Review error logs with Request ID correlation
- [ ] Identify error category (auth, validation, rate limit, database, external API)
- [ ] Determine severity level (low, medium, high, critical)
- [ ] Check affected users (single user vs. system-wide)

### Phase 2: Contain Impact
- [ ] If database issue: Verify connection pool status, kill long-running queries
- [ ] If external API issue: Confirm API status, check fallback mechanisms
- [ ] If rate limit: Verify legitimate traffic, adjust limits if attack suspected
- [ ] If authentication: Verify Supabase service status, clear affected sessions
- [ ] If storage: Check Supabase Storage quota and connectivity

### Phase 3: Verify Recovery
- [ ] Run health check endpoint - all services return "healthy"
- [ ] Test affected endpoint manually (Postman, curl, or browser)
- [ ] Verify error rate decreased in logs
- [ ] Confirm cache cleared if data issue
- [ ] Test end-to-end user flow (upload → process → view)

### Phase 4: Document Root Cause
- [ ] Identify initial trigger (code change, traffic spike, external failure)
- [ ] Document timeline of incident
- [ ] Record Request IDs for affected operations
- [ ] Capture relevant log entries and error patterns
- [ ] Note any degraded performance metrics
- [ ] Document temporary vs. permanent fix

### Phase 5: Add Detection
- [ ] Add monitoring for specific error pattern
- [ ] Implement alerting if missing (future: AWS CloudWatch)
- [ ] Add health check coverage if gap identified
- [ ] Update validation scripts (`npm run validate:*`)
- [ ] Add regression test to prevent recurrence
- [ ] Document in runbook for future reference

---

## Escalation Policy

### Issue Classification

**If issue is:**

#### Infrastructure → DevOps / Platform Team
- **Examples:**
  - Vercel deployment failures
  - Supabase service degradation
  - Database connection pool exhaustion
  - SSL certificate issues
  - DNS or routing problems
  - Environment variable misconfiguration

- **Escalation Path:**
  1. Check platform status pages (Vercel, Supabase)
  2. Review deployment logs and build output
  3. Contact platform support if confirmed outage
  4. Escalate to DevOps for infrastructure changes

#### Logic Defect → Engineering Team
- **Examples:**
  - Duplicate detection false positives/negatives
  - Incorrect receipt total calculations
  - Search returning wrong results
  - Statistics showing incorrect data
  - UI rendering bugs
  - API response format issues

- **Escalation Path:**
  1. Create bug report with reproduction steps
  2. Provide Request ID and error logs
  3. Include environment context and stack trace
  4. Assign to appropriate team (Frontend vs. Backend)
  5. Tag with severity level

#### External API Failure → Service Provider / Engineering
- **Examples:**
  - OpenAI API timeouts or rate limits
  - Google Cloud Vision quota exceeded
  - Supabase Auth service unavailable
  - OAuth provider issues

- **Escalation Path:**
  1. Verify service status page for provider
  2. Check API quota and billing status
  3. Test with provider's diagnostic tools
  4. Contact provider support if confirmed issue
  5. Implement fallback if available (e.g., fallback OCR)

#### Usage Error → Support Response
- **Examples:**
  - User uploading wrong file format
  - User confused about duplicate detection
  - User hitting rate limits (legitimate usage)
  - User requesting feature explanation

- **Escalation Path:**
  1. Provide user education and documentation
  2. Guide through correct workflow
  3. Offer workaround if available
  4. Collect feedback for UX improvements
  5. Do NOT escalate to engineering unless bug confirmed

### Severity Levels

**Critical (P0)** - System down or major functionality broken
- Response time: Immediate
- Examples: Database unreachable, all uploads failing, authentication broken
- Action: Page on-call engineer, begin incident response

**High (P1)** - Significant feature impaired, affecting multiple users
- Response time: < 1 hour
- Examples: OCR failing, AI extraction down, statistics incorrect
- Action: Assign to engineering team, monitor health checks

**Medium (P2)** - Non-critical feature degraded, workaround available
- Response time: < 4 hours
- Examples: Search slow, duplicate detection edge cases, export delays
- Action: Create ticket, schedule fix in next sprint

**Low (P3)** - Minor issue, cosmetic, or affects single user
- Response time: < 24 hours
- Examples: UI spacing issue, typo, individual user configuration
- Action: Create backlog item, prioritize based on impact

---

## Monitoring and Alerts

### Current Monitoring System

This system uses:

#### 1. Health Checks
- **Endpoint:** `GET /api/health`
- **Location:** `/src/app/api/health/route.ts`
- **Frequency:** On-demand (should be called by uptime monitor)
- **Services Monitored:**
  - Database (PostgreSQL via Supabase)
  - Storage (Supabase Storage - receipts bucket)
  - OCR (Google Cloud Vision API)
  - AI (OpenAI GPT-4o-mini)

**Response Format:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2025-12-03T10:30:45.123Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ocr": "healthy",
    "ai": "healthy"
  },
  "details": {
    "database": "Connected successfully. Receipt count: 150",
    "storage": "Storage connected. Receipts bucket found.",
    "ocr": "OCR service working. Test completed successfully.",
    "ai": "AI service working. Test extraction successful."
  },
  "environment": {
    "nodeEnv": "production",
    "hasOpenAIKey": true,
    "hasGoogleCredentials": true,
    "hasSupabaseConfig": true
  }
}
```

**Status Codes:**
- `200 OK` - All healthy or degraded (partial)
- `503 Service Unavailable` - All unhealthy

#### 2. Error Logging
- **Implementation:** Custom logger (`/src/lib/services/logger.ts`)
- **Features:**
  - Automatic PII sanitization (emails, phone numbers, SSNs, credit cards)
  - Request ID tracking for correlation
  - Log levels: `debug`, `info`, `warn`, `error`
  - Security levels: `public`, `internal`, `sensitive`, `pii`
  - Structured JSON output with timestamps
  - Performance metrics (operation duration, success/failure)

**Sensitive Data Filtered:**
- Merchant names, amounts, currency
- User emails, phone numbers
- API keys, JWT tokens, connection strings
- Credit card numbers, SSNs
- File paths, stack traces (external only)

#### 3. Basic Uptime Tracking
- **Method:** Middleware execution timing
- **Header:** `X-Middleware-Time` (milliseconds)
- **Logged Metrics:**
  - API endpoint response times
  - OCR processing duration
  - AI extraction duration
  - Database query performance
  - Health check service latency

#### 4. Performance Monitoring
- **Tracked Operations:**
  - Receipt upload end-to-end time
  - Duplicate detection processing time
  - Search query latency
  - Dashboard data aggregation time
  - Export generation time

### Planned AWS Integration

**Documented in:** `/docs/AWS_PLANNING.md`

**Future Monitoring Improvements:**
1. **AWS CloudWatch** - Centralized logging and metrics
2. **AWS CloudWatch Alarms** - Automated alerting
3. **AWS X-Ray** - Distributed tracing
4. **AWS ElastiCache (Redis)** - Distributed caching with metrics
5. **AWS CloudFront** - CDN performance metrics

### Validation Scripts

**Foundation Validation:**
```bash
# Local environment
npm run validate:foundation:local

# Production environment
npm run validate:foundation:production
```

**Production Readiness:**
```bash
npm run validate:production      # Full validation
npm run validate:env             # Environment variables only
npm run validate:build           # Build verification only
npm run validate:test            # Test execution only
```

**Database Validation:**
```bash
npm run db:test                  # Connection test
npm run db:studio                # Open Prisma Studio
```

### Recommended Alert Thresholds

**Error Rate:**
- Warning: > 5% of requests failing
- Critical: > 20% of requests failing

**Response Time:**
- Warning: P95 latency > 3 seconds
- Critical: P95 latency > 10 seconds

**Health Check:**
- Warning: Any service degraded
- Critical: Any service unhealthy for > 5 minutes

**Rate Limiting:**
- Info: Individual user hitting rate limit
- Warning: > 10 users hitting rate limit in 15 minutes
- Critical: Rate limiter memory usage > 80%

**External APIs:**
- Warning: OpenAI or Google Cloud Vision latency > 5 seconds
- Critical: External API down for > 5 minutes
- Info: Quota at 80% capacity

---

## Additional Resources

### Key File Locations

| Component | File Path |
|-----------|-----------|
| Error Handler | `/src/lib/services/errorHandler.ts` |
| Logger | `/src/lib/services/logger.ts` |
| Rate Limiter | `/src/lib/rate-limiter.ts` |
| Duplicate Detection | `/src/lib/services/duplicateDetection.ts` |
| Database Client | `/src/lib/db.ts` |
| Supabase Client | `/src/lib/supabase.ts` |
| OCR Service | `/src/lib/services/cloudOcr.ts` |
| AI Service | `/src/lib/services/openai.ts` |
| Cache Service | `/src/lib/services/cache.ts` |
| Health Check API | `/src/app/api/health/route.ts` |
| Receipt Upload API | `/src/app/api/receipts/upload/route.ts` |
| Duplicate Detection API | `/src/app/api/receipts/duplicates/detect/route.ts` |
| Retry Processing API | `/src/app/api/receipts/retry-processing/route.ts` |
| Auth Middleware | `/src/middleware.ts` |
| Prisma Schema | `/prisma/schema.prisma` |

### Testing Documentation

- Unit tests: 30 passing (duplicate detection)
- Integration tests: Templates ready (67 tests planned)
- Test commands: See `package.json` scripts section

### Security Documentation

- Recent security audit completed (commit `57d839e`)
- All vulnerabilities fixed (commit `291df3b`)
- PII sanitization in logs (commit `a29205b`)
- Input validation and rate limiting implemented

---

**Last Updated:** 2025-12-03
**Version:** 1.0.0
**Maintained By:** Technical Support Team
