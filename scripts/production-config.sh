#!/bin/bash

# ============================================================================
# PRODUCTION CONFIGURATION SCRIPT - AI-First Architecture
# ============================================================================
# Production environment setup for optimized deployment
# Focuses on performance and security for AI agent operations

echo "🚀 Setting up Production Environment Configuration..."

# Create production environment file
cat > .env.production << EOF
# ============================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION - AI-First Architecture
# ============================================================================
# Production environment variables for optimized deployment
# Focuses on performance and security for AI agent operations

# Environment
NODE_ENV=production

# AI Integration
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=your_supabase_database_url

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

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
EOF

echo "✅ Production environment configuration created!"
echo "📝 Please update the placeholder values in .env.production with your actual credentials" 