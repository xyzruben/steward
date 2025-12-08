# Environment Variables Audit

**Purpose**: Document all environment variables required for duplicate detection functionality across all environments.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Overview

Ensure all necessary environment variables are configured in development, staging, and production environments.

---

## Current Environment Variables

### Find All Environment Variables

**Check .env files**:
```bash
# Development
cat .env.local | grep -v "^#" | grep "="

# Check for .env examples
cat .env.example 2>/dev/null || echo "No .env.example found"
```

**Results**:
```
[Paste current environment variables here]
```

---

## Required Variables for Duplicate Detection

### No New Variables Required ✅

**Good news**: The duplicate detection feature does NOT require any new environment variables.

**Reason**: All functionality uses existing:
- Database (already configured via `DATABASE_URL`)
- Prisma (already configured)
- No external APIs for duplicate detection

---

## Existing Variables Verification

### Core Database Variables

#### 1. DATABASE_URL

**Purpose**: PostgreSQL connection string for Prisma

**Required**: ✅ Yes (Critical)

**Format**:
```
DATABASE_URL="postgresql://user:password@host:port/database"
```

**Current Value** (development):
```
[Document format, NOT actual password]
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Verification**:
```bash
# Test connection
npx prisma db pull
```

**Status**: ⬜ Verified / ⬜ Needs Update

---

### Supabase Variables

#### 2. NEXT_PUBLIC_SUPABASE_URL

**Purpose**: Supabase project URL for client-side connections

**Required**: ✅ Yes

**Format**:
```
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

---

#### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose**: Supabase anonymous key for client-side access

**Required**: ✅ Yes

**Format**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

---

#### 4. SUPABASE_SERVICE_ROLE_KEY

**Purpose**: Supabase service role key for server-side admin access

**Required**: ✅ Yes (for server-side operations)

**Security**: 🔒 **CRITICAL** - Must be kept secret, server-side only

**Format**:
```
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

---

### AI/ML Variables (for OCR and categorization)

#### 5. OPENAI_API_KEY

**Purpose**: OpenAI API for receipt data extraction and categorization

**Required**: ✅ Yes (for receipt processing)

**Format**:
```
OPENAI_API_KEY="sk-proj-xxxxx"
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

**Impact on Duplicate Detection**: Required for extracting merchant, total, and date from receipts (which are used for duplicate detection)

---

#### 6. GOOGLE_APPLICATION_CREDENTIALS_JSON

**Purpose**: Google Cloud Vision API credentials for OCR

**Required**: ✅ Yes (for receipt OCR)

**Format**:
```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"...",...}'
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

**Impact on Duplicate Detection**: Required for extracting text from receipt images (rawText used in duplicate matching)

---

### Application Variables

#### 7. NEXT_PUBLIC_APP_URL

**Purpose**: Application base URL (for callbacks, emails, etc.)

**Required**: ⬜ Optional (but recommended)

**Format**:
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
NEXT_PUBLIC_APP_URL="https://hellosteward.org"  # Production
```

**Environments**:
- [ ] Development: ⬜ Set / ⬜ Not Set
- [ ] Staging: ⬜ Set / ⬜ Not Set
- [ ] Production: ⬜ Set / ⬜ Not Set

**Status**: ⬜ Verified / ⬜ Needs Update

---

## Optional Feature Flags

### For Advanced Duplicate Detection (Future)

#### DUPLICATE_DETECTION_ENABLED

**Purpose**: Feature flag to enable/disable duplicate detection

**Required**: ⬜ Optional

**Suggested Format**:
```
DUPLICATE_DETECTION_ENABLED="true"
```

**Current Status**: Not implemented

**Recommendation**: Not needed for initial implementation. All users get duplicate detection.

---

#### DUPLICATE_AUTO_MARK_THRESHOLD

**Purpose**: Confidence threshold for automatically marking duplicates

**Required**: ⬜ Optional

**Suggested Format**:
```
DUPLICATE_AUTO_MARK_THRESHOLD="0.90"
```

**Current Status**: Not implemented

**Recommendation**: Hardcode in application for now (0.90), make configurable later if needed.

---

#### DUPLICATE_DETECTION_TIMEOUT

**Purpose**: Maximum time to spend on duplicate detection

**Required**: ⬜ Optional

**Suggested Format**:
```
DUPLICATE_DETECTION_TIMEOUT="5000"  # 5 seconds
```

**Current Status**: Not implemented

**Recommendation**: Hardcode timeout for now, make configurable later if needed.

---

## Environment-Specific Configuration

### Development Environment

**.env.local** (not committed to git)

**Required Variables**:
- [x] DATABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] OPENAI_API_KEY
- [x] GOOGLE_APPLICATION_CREDENTIALS_JSON
- [x] NEXT_PUBLIC_APP_URL (http://localhost:3000)

**Verification Commands**:
```bash
# Check all required variables are set
[ -n "$DATABASE_URL" ] && echo "✓ DATABASE_URL set" || echo "✗ DATABASE_URL missing"
[ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "✓ SUPABASE_URL set" || echo "✗ SUPABASE_URL missing"
[ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && echo "✓ SUPABASE_ANON_KEY set" || echo "✗ SUPABASE_ANON_KEY missing"
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✓ SUPABASE_SERVICE_KEY set" || echo "✗ SUPABASE_SERVICE_KEY missing"
[ -n "$OPENAI_API_KEY" ] && echo "✓ OPENAI_API_KEY set" || echo "✗ OPENAI_API_KEY missing"
[ -n "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ] && echo "✓ GOOGLE_CREDS set" || echo "✗ GOOGLE_CREDS missing"
```

---

### Staging Environment (if applicable)

**Platform**: Vercel / Other: _____

**Configuration Method**:
- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] Other: _____

**Required Variables**: Same as production

**Differences from Production**:
- DATABASE_URL points to staging database
- NEXT_PUBLIC_APP_URL points to staging URL

**Verification**: Deploy to staging and test

---

### Production Environment

**Platform**: Vercel (iad1 region)

**Configuration Method**:
- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] Environment: Production
- [ ] Encrypted: Yes

**Required Variables**:
- [x] DATABASE_URL (Supabase production)
- [x] NEXT_PUBLIC_SUPABASE_URL (production project)
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY (production key)
- [x] SUPABASE_SERVICE_ROLE_KEY (production key)
- [x] OPENAI_API_KEY (production key)
- [x] GOOGLE_APPLICATION_CREDENTIALS_JSON (production credentials)
- [x] NEXT_PUBLIC_APP_URL (https://hellosteward.org)

**Security Notes**:
- 🔒 Never commit production keys to git
- 🔒 Rotate keys if exposed
- 🔒 Use Vercel's encrypted environment variables
- 🔒 Restrict service role key access

**Verification**:
- [ ] All variables set in Vercel dashboard
- [ ] Application starts without errors
- [ ] Database connection works
- [ ] Receipt upload works (requires all keys)
- [ ] Duplicate detection works

---

## Environment Variable Checklist

### Pre-Deployment Checklist

**Development**:
- [ ] All required variables set
- [ ] Database connection works
- [ ] Prisma can connect
- [ ] Receipt upload works
- [ ] Duplicate detection works

**Staging** (if applicable):
- [ ] All required variables set
- [ ] Points to staging resources
- [ ] Separate from production data
- [ ] All features tested

**Production**:
- [ ] All required variables set
- [ ] Points to production resources
- [ ] Keys are production keys (not dev/staging)
- [ ] All variables encrypted
- [ ] No exposed secrets in logs

---

## Missing Variable Detection

### Runtime Checks

**Add to application startup** (recommended):

```typescript
// src/lib/env.ts

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
]

export function checkRequiredEnvVars() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(varName => console.error(`   - ${varName}`))
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  console.log('✅ All required environment variables are set')
}
```

**Call during startup**:
```typescript
// src/app/layout.tsx or middleware.ts
import { checkRequiredEnvVars } from '@/lib/env'

if (process.env.NODE_ENV === 'production') {
  checkRequiredEnvVars()
}
```

---

## Database Connection Verification

### Test Database Connection

**Development**:
```bash
npx prisma db pull
```

**Expected**: Schema pulled successfully

**Production** (via Vercel CLI):
```bash
vercel env pull .env.production
# Then test locally with production env
```

---

## Documentation Updates Needed

### .env.example File

**Create or Update** `.env.example`:

```bash
# .env.example

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/steward"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# OpenAI (for receipt data extraction)
OPENAI_API_KEY="sk-proj-xxxxx"

# Google Cloud Vision (for OCR)
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Feature Flags (future)
# DUPLICATE_DETECTION_ENABLED="true"
# DUPLICATE_AUTO_MARK_THRESHOLD="0.90"
```

---

### README.md Update

**Add to README.md**:

```markdown
## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `OPENAI_API_KEY` - OpenAI API key for receipt processing
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Google Cloud Vision credentials
- `NEXT_PUBLIC_APP_URL` - Application URL (http://localhost:3000 for dev)

See `.env.example` for full details.
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "DATABASE_URL is not defined"

**Symptom**: Prisma errors on startup
**Cause**: Missing DATABASE_URL
**Solution**: Add to .env.local or Vercel dashboard

---

#### Issue 2: "Authentication failed"

**Symptom**: Cannot connect to Supabase
**Cause**: Wrong SUPABASE keys or URL
**Solution**: Verify keys in Supabase dashboard

---

#### Issue 3: "OpenAI API key invalid"

**Symptom**: Receipt processing fails
**Cause**: Wrong or expired OPENAI_API_KEY
**Solution**: Generate new key from OpenAI dashboard

---

#### Issue 4: "Google Cloud Vision authentication failed"

**Symptom**: OCR fails
**Cause**: Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON
**Solution**: Download new service account key from Google Cloud Console

---

## Security Best Practices

### Do's ✅

- Use .env.local for development (gitignored)
- Use Vercel environment variables for production
- Rotate keys regularly
- Use different keys for dev/staging/production
- Encrypt sensitive variables
- Document required variables in .env.example

### Don'ts ❌

- Never commit .env files to git
- Never expose SUPABASE_SERVICE_ROLE_KEY client-side
- Never log environment variables
- Never share production keys in Slack/email
- Never use production database for development

---

## Migration Impact

### Environment Changes Required

**For Duplicate Detection Feature**:
- [ ] No new environment variables required ✅
- [ ] No changes to existing variables ✅
- [ ] No new API keys needed ✅
- [ ] No new third-party services ✅

**Conclusion**: Duplicate detection feature has ZERO environment variable dependencies beyond what already exists.

---

## Sign-Off

- [ ] **All required variables documented**: Date: _____ By: _____
- [ ] **Development environment verified**: Date: _____ By: _____
- [ ] **Staging environment verified** (if applicable): Date: _____ By: _____
- [ ] **Production environment verified**: Date: _____ By: _____
- [ ] **.env.example updated**: Date: _____ By: _____
- [ ] **README.md updated**: Date: _____ By: _____

**Overall Status**: ⬜ ALL ENVIRONMENTS READY / ⬜ NEEDS CONFIGURATION

---

**Next Step**: Once all environments are verified, proceed to BACKWARDS_COMPATIBILITY_CHECKLIST.md
