# Developer Onboarding Guide

## Welcome to Steward! 🎉

Welcome to the Steward development team! This guide will help you get up and running with our AI-native financial assistant platform. Steward is a production-grade, AI-powered receipt and expense tracker that leverages OpenAI function calling for intelligent financial analysis.

## Quick Start

### Prerequisites

- **Node.js**: Version 18+ (ARM64 for Apple Silicon)
- **Git**: Latest version
- **Database**: PostgreSQL (via Supabase)
- **AI Services**: OpenAI API access

### Environment Setup

1. **Clone the Repository**:
```bash
git clone https://github.com/xyzruben/steward.git
cd steward
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Environment Configuration**:
```bash
# Copy environment template
cp .env.example .env.local

# Configure required environment variables
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

5. **Start Development Server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Architecture Overview

### System Architecture

Steward follows a modern, AI-native architecture with the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                   │
│  • React 19 with App Router                                │
│  • TypeScript with strict mode                             │
│  • Tailwind CSS + shadcn/ui components                     │
│  • Real-time updates and streaming responses               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)          │
│  • RESTful API endpoints                                   │
│  • Authentication via Supabase                             │
│  • Rate limiting and validation                            │
│  • Streaming responses for AI agent                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (TypeScript)                │
│  • FinanceAgent: AI orchestration                          │
│  • FinanceFunctions: Database operations                   │
│  • MonitoringService: Observability                        │
│  • Caching and performance optimization                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                 │
│  • Prisma ORM (PostgreSQL)                                 │
│  • Supabase (Auth + Storage)                               │
│  • OpenAI API (GPT-4o + Function Calling)                  │
│  • Redis Cache (Performance)                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. AI Financial Assistant Agent
- **Location**: `src/lib/services/financeAgent.ts`
- **Purpose**: Core AI orchestration with OpenAI function calling
- **Features**: Natural language processing, intelligent query routing, response composition

#### 2. Financial Analysis Functions
- **Location**: `src/lib/services/financeFunctions.ts`
- **Purpose**: Database operations and financial calculations
- **Functions**: 9 core financial analysis functions (spending, trends, anomalies)

#### 3. Monitoring & Analytics
- **Location**: `src/lib/services/monitoring.ts`
- **Purpose**: Comprehensive observability and performance tracking
- **Features**: Query logging, error tracking, usage analytics

#### 4. Frontend Components
- **AgentChat**: `src/components/agent/AgentChat.tsx`
- **Monitoring Dashboard**: `src/components/monitoring/AgentMonitoringDashboard.tsx`
- **Analytics**: `src/components/analytics/`

## Development Workflow

### Code Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── agent/         # AI agent endpoints
│   │   ├── monitoring/    # Monitoring endpoints
│   │   └── analytics/     # Analytics endpoints
│   └── (pages)/           # Application pages
├── components/            # React components
│   ├── agent/            # AI agent UI components
│   ├── monitoring/       # Monitoring dashboard
│   ├── analytics/        # Analytics components
│   └── ui/               # Reusable UI components
├── lib/                  # Core libraries and services
│   ├── services/         # Business logic services
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Utility functions
├── context/              # React context providers
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

### Development Patterns

#### 1. Adding New AI Functions

```typescript
// 1. Define the function in financeFunctions.ts
export async function getNewAnalysis(
  userId: string,
  params: NewAnalysisParams
): Promise<NewAnalysisResult> {
  // Implementation with real database queries
  const results = await prisma.receipt.findMany({
    where: { userId, /* query conditions */ }
  });
  
  return {
    // Processed results
  };
}

// 2. Add to function registry in financeAgent.ts
const functionSchemas = [
  {
    name: "getNewAnalysis",
    description: "Description of what this function does",
    parameters: {
      type: "object",
      properties: {
        // Parameter definitions
      },
      required: ["requiredParam"]
    }
  }
];

// 3. Update function mapping
const functionMap = {
  getNewAnalysis: financeFunctions.getNewAnalysis
};
```

#### 2. Creating New API Endpoints

```typescript
// src/app/api/new-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request
    const body = await request.json();
    // ... validation logic

    // 3. Process request
    // ... business logic

    // 4. Return response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 3. Creating New React Components

```typescript
// src/components/new-feature/NewComponent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NewComponentProps {
  className?: string;
}

export function NewComponent({ className = '' }: NewComponentProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Component initialization
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

### Testing Strategy

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=AgentChat.test.tsx

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Test Patterns

```typescript
// Unit test example
describe('FinanceAgent', () => {
  it('should process natural language query', async () => {
    const agent = new FinanceAgent();
    const result = await agent.handleQuery(
      'How much did I spend on food?',
      userId
    );
    
    expect(result.message).toContain('spent');
    expect(result.data).toBeDefined();
  });
});

// Component test example
describe('AgentChat', () => {
  it('should display agent response', async () => {
    render(<AgentChat />);
    
    const input = screen.getByPlaceholderText(/Ask about your spending/);
    await user.type(input, 'How much did I spend?');
    
    await waitFor(() => {
      expect(screen.getByText(/spent/)).toBeInTheDocument();
    });
  });
});
```

### Code Quality Standards

#### TypeScript Standards

- **Strict Mode**: Always enabled, no exceptions
- **Type Safety**: Avoid `any` types, use proper interfaces
- **Error Handling**: Comprehensive error handling with proper types

```typescript
// Good: Proper typing
interface UserProfile {
  id: string;
  email: string;
  preferences: UserPreferences;
}

// Avoid: Using any
const data: any = await fetchData(); // ❌
const data: UserProfile = await fetchData(); // ✅
```

#### Code Style

- **ESLint**: Follow project ESLint configuration
- **Prettier**: Automatic code formatting
- **Naming**: PascalCase for components, camelCase for functions

```typescript
// Component naming
export function UserProfile() { } // ✅
export function userProfile() { } // ❌

// Function naming
const getUserData = () => { } // ✅
const GetUserData = () => { } // ❌
```

## AI Agent Development

### Understanding Function Calling

The AI agent uses OpenAI function calling to dynamically select and execute financial analysis functions based on natural language queries.

#### Function Schema Example

```typescript
{
  name: "getSpendingByCategory",
  description: "Get spending breakdown by category for a specific time period",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Category to analyze (e.g., 'food', 'transportation')"
      },
      startDate: {
        type: "string",
        format: "date",
        description: "Start date for analysis (YYYY-MM-DD)"
      },
      endDate: {
        type: "string",
        format: "date",
        description: "End date for analysis (YYYY-MM-DD)"
      }
    },
    required: ["category"]
  }
}
```

#### Adding New Functions

1. **Define the function** in `financeFunctions.ts`
2. **Add schema** to `functionSchemas` array in `financeAgent.ts`
3. **Map the function** in `functionMap` object
4. **Write tests** for the new function
5. **Update documentation** in `AI_AGENT_DOCUMENTATION.md`

### Monitoring and Observability

#### Logging Patterns

```typescript
// Agent query logging
await monitoringService.logAgentQuery(
  userId,
  query,
  responseTime,
  success,
  functionsUsed,
  cached,
  error,
  metadata
);

// Error logging
await monitoringService.logError(
  userId,
  query,
  error.message,
  error.stack,
  context,
  severity
);
```

#### Performance Monitoring

```typescript
// Response time tracking
const startTime = Date.now();
const result = await processQuery();
const responseTime = Date.now() - startTime;

// Cache monitoring
const cacheStats = await analyticsCache.getStats();
const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
```

## Database Development

### Prisma Schema

The database schema is defined in `prisma/schema.prisma` and includes:

- **User Management**: User profiles and preferences
- **Receipt Data**: Receipt storage with embeddings
- **Analytics**: Monitoring and logging tables
- **AI Agent**: Agent logs and error tracking

#### Schema Changes

```bash
# After modifying schema.prisma
npx prisma generate    # Update Prisma client
npx prisma db push     # Apply changes to database
npx prisma studio      # Open database browser
```

#### Database Queries

```typescript
// Example Prisma query
const receipts = await prisma.receipt.findMany({
  where: {
    userId,
    category: 'food',
    date: {
      gte: startDate,
      lte: endDate
    }
  },
  include: {
    user: true
  },
  orderBy: {
    date: 'desc'
  }
});
```

## Deployment and Production

### Environment Configuration

#### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# AI Services
OPENAI_API_KEY=sk-...

# Optional
REDIS_URL=redis://...
NEXT_PUBLIC_APP_URL=https://...
```

#### Build Process

```bash
# Production build
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate deploy
```

### Monitoring Production

#### Health Checks

- **Application Health**: `/api/health`
- **Database Health**: Prisma connection status
- **AI Service Health**: OpenAI API connectivity
- **Cache Health**: Redis connection status

#### Performance Monitoring

- **Response Times**: Track API response times
- **Error Rates**: Monitor error frequencies
- **Cache Hit Rates**: Optimize caching strategy
- **User Engagement**: Track feature usage

## Troubleshooting

### Common Issues

#### 1. Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 2. Database Connection Issues

```bash
# Check database connection
npx prisma db pull

# Reset database (development only)
npx prisma db push --force-reset
```

#### 3. OpenAI API Issues

```bash
# Verify API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### 4. Authentication Issues

```bash
# Check Supabase configuration
# Verify environment variables
# Test authentication flow
```

### Debugging Tools

#### Development Tools

- **Prisma Studio**: Database browser (`npx prisma studio`)
- **Next.js DevTools**: Built-in debugging
- **React DevTools**: Component inspection
- **Network Tab**: API request monitoring

#### Logging

```typescript
// Development logging
console.log('Debug info:', data);

// Production logging
console.error('Error occurred:', error);
```

## Best Practices

### Code Quality

1. **Write Tests**: Every new feature should have tests
2. **Type Safety**: Use TypeScript strictly, avoid `any`
3. **Error Handling**: Comprehensive error handling
4. **Documentation**: Document complex logic and APIs

### Performance

1. **Caching**: Use caching for expensive operations
2. **Database Optimization**: Optimize queries and use indexes
3. **Bundle Size**: Keep bundle size minimal
4. **Lazy Loading**: Load components and data on demand

### Security

1. **Authentication**: Always verify user sessions
2. **Input Validation**: Validate all user inputs
3. **Rate Limiting**: Prevent API abuse
4. **Error Sanitization**: Don't expose sensitive data

### AI Agent Development

1. **Function Schemas**: Write clear, descriptive schemas
2. **Error Handling**: Graceful handling of AI failures
3. **Caching**: Cache common queries for performance
4. **Monitoring**: Comprehensive logging and metrics

## Getting Help

### Resources

- **Documentation**: Check `docs/` directory
- **Code Examples**: Review existing implementations
- **TypeScript**: Official TypeScript documentation
- **Next.js**: Next.js documentation and examples
- **Prisma**: Prisma documentation and examples

### Team Support

- **Code Reviews**: Submit PRs for review
- **Architecture Questions**: Discuss with senior developers
- **AI Agent Questions**: Review AI_AGENT_DOCUMENTATION.md
- **Database Questions**: Check Prisma schema and migrations

### External Resources

- **OpenAI API**: Function calling documentation
- **Supabase**: Authentication and database documentation
- **Tailwind CSS**: Styling and component documentation
- **shadcn/ui**: Component library documentation

---

Welcome to the team! We're excited to have you contribute to Steward's AI-native financial assistant platform. If you have any questions or need help getting started, don't hesitate to reach out to the team.

Happy coding! 🚀 