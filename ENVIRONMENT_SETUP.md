# 🎯 **COMPLETE ENVIRONMENT SETUP GUIDE**

## 🚨 **CRITICAL: Missing Variables in Vercel**

Your Vercel environment is missing **3 critical variables** that are causing the async processing to fail:

### **MISSING IN VERCEL (Add These Now):**

1. **`NEXT_PUBLIC_APP_URL`** = `https://hellosteward.org`
2. **`ENABLE_RATE_LIMITING`** = `true`
3. **`ENABLE_HEALTH_CHECKS`** = `true`

---

## 📋 **COMPLETE VERCEL ENVIRONMENT VARIABLES**

### **Required Variables (Add to Vercel Dashboard):**

```bash
# Environment
NODE_ENV=production

# AI Integration
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=your_supabase_database_url_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_google_credentials_json_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://hellosteward.org

# Performance Configuration
AI_CACHE_TTL=3600
AI_MAX_CONCURRENT_REQUESTS=10
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60000

# Logging Configuration
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true

# Security Configuration
ENABLE_RATE_LIMITING=true
ENABLE_HEALTH_CHECKS=true

# Google Cloud Project
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id_here
```

---

## 📁 **LOCAL ENVIRONMENT FILES**

### **`.env` (Base Configuration)**
```bash
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Database
DATABASE_URL="your_supabase_database_url_here"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url_here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"

# OpenAI
OPENAI_API_KEY="your_openai_api_key_here"

# Google
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Application URL
NEXT_PUBLIC_APP_URL=https://hellosteward.org
```

### **`.env.local` (Local Development)**
```bash
# Database
DATABASE_URL="your_supabase_database_url_here"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url_here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"

# OpenAI
OPENAI_API_KEY="your_openai_api_key_here"

# Google
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# Google Cloud Vision API - JSON credentials as string
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_google_credentials_json_here

# Next.js
NEXTAUTH_URL=https://hellosteward.org
```

### **`.env.production` (Production Configuration)**
```bash
# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION - AI-First Architecture
# ============================================================================
# Production environment variables for optimized deployment
# Focuses on performance and security for AI agent operations

# Environment
NODE_ENV=production

# AI Integration
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=your_supabase_database_url_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Cloud Vision API - JSON credentials as string
GOOGLE_CLOUD_VISION_API_KEY=your_google_credentials_json_here

# Application Configuration
NEXT_PUBLIC_APP_URL=https://hellosteward.org

# Performance Configuration
AI_CACHE_TTL=3600
AI_MAX_CONCURRENT_REQUESTS=10
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60000

# Logging Configuration
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true

# Security Configuration
ENABLE_RATE_LIMITING=true
ENABLE_HEALTH_CHECKS=true
```

---

## 🚀 **IMMEDIATE ACTION REQUIRED**

### **Step 1: Add Missing Variables to Vercel**
1. Go to: `https://vercel.com/dashboard`
2. Select your steward project
3. Go to Settings → Environment Variables
4. Add these **3 missing variables**:
   - `NEXT_PUBLIC_APP_URL` = `https://hellosteward.org`
   - `ENABLE_RATE_LIMITING` = `true`
   - `ENABLE_HEALTH_CHECKS` = `true`

### **Step 2: Redeploy**
1. Push your changes to GitHub
2. Vercel will automatically redeploy with the new environment variables

### **Step 3: Test Receipt Processing**
1. Upload a new receipt
2. Check if async processing completes successfully
3. Verify the receipt appears in the dashboard

---

## 🎯 **EXPECTED OUTCOME**

After adding these missing environment variables:
- ✅ **Async processing will work** - Receipts will be processed automatically
- ✅ **No more "Processing..." stuck receipts** - All receipts will complete processing
- ✅ **Dashboard will update correctly** - Real data will appear immediately
- ✅ **AI agent will function properly** - All AI features will work as expected

---

## 🔍 **TROUBLESHOOTING**

If issues persist after adding the missing variables:

1. **Check Vercel logs** for any remaining errors
2. **Verify all variables are set** in Vercel dashboard
3. **Test with a fresh receipt upload**
4. **Check the retry processing endpoint** if needed

**The missing `NEXT_PUBLIC_APP_URL`, `ENABLE_RATE_LIMITING`, and `ENABLE_HEALTH_CHECKS` variables are the root cause of your async processing failures!** 🎯 