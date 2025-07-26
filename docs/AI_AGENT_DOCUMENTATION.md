# AI Financial Assistant Agent Documentation

## Overview

The Steward AI Financial Assistant Agent is an intelligent, conversational interface that enables users to query their financial data using natural language. Built with OpenAI function calling, it provides real-time insights, spending analysis, and financial recommendations.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   AgentChat     │  │ Monitoring      │  │ Analytics    │ │
│  │   Component     │  │ Dashboard       │  │ Dashboard    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ /api/agent/     │  │ /api/monitoring/│  │ /api/analytics│ │
│  │ query           │  │ agent-metrics   │  │ /overview     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ FinanceAgent    │  │ MonitoringService│  │ FinanceFunctions│ │
│  │ (Orchestration) │  │ (Logging)       │  │ (Database)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Prisma ORM    │  │   Supabase      │  │   OpenAI     │ │
│  │   (PostgreSQL)  │  │   (Auth)        │  │   (GPT-4o)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

#### 1. FinanceAgent (`src/lib/services/financeAgent.ts`)
- **Purpose**: Core orchestration service for AI agent functionality
- **Responsibilities**:
  - OpenAI API integration with function calling
  - Query processing and intent recognition
  - Response composition and formatting
  - Caching and performance optimization
  - Error handling and fallback strategies

#### 2. FinanceFunctions (`src/lib/services/financeFunctions.ts`)
- **Purpose**: Registry of callable financial analysis functions
- **Functions Available**:
  - `getSpendingByCategory` - Category-based spending analysis
  - `getSpendingByTime` - Time period spending analysis
  - `getSpendingByVendor` - Vendor/merchant spending analysis
  - `getSpendingForCustomPeriod` - Custom date range analysis
  - `getSpendingComparison` - Period-to-period comparisons
  - `detectSpendingAnomalies` - Anomaly detection with historical analysis
  - `getSpendingTrends` - Time series trend analysis
  - `summarizeTopVendors` - Top vendor summaries
  - `summarizeTopCategories` - Top category summaries

#### 3. MonitoringService (`src/lib/services/monitoring.ts`)
- **Purpose**: Comprehensive monitoring and analytics for agent usage
- **Capabilities**:
  - Agent query logging and performance tracking
  - Error tracking with severity levels
  - Usage analytics and cache statistics
  - User engagement metrics
  - Health monitoring and alerting

## API Reference

### Agent Query Endpoint

**POST** `/api/agent/query`

Process natural language queries and return financial insights.

#### Request Body
```typescript
{
  query: string;           // Natural language query
  streaming?: boolean;     // Enable streaming response (default: false)
  metadata?: {            // Optional metadata
    userAgent?: string;
    ip?: string;
    sessionId?: string;
  }
}
```

#### Response Format
```typescript
{
  message: string;         // Natural language response
  data: any;              // Structured data results
  insights?: string[];    // Key insights and recommendations
  error?: string;         // Error message if failed
  cached?: boolean;       // Whether response was cached
  executionTime?: number; // Response time in milliseconds
  functionsUsed?: string[]; // Functions called during processing
}
```

#### Example Usage
```typescript
// Regular query
const response = await fetch('/api/agent/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "How much did I spend on restaurants last month?"
  })
});

// Streaming query
const response = await fetch('/api/agent/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Analyze my spending patterns",
    streaming: true
  })
});
```

### Monitoring Metrics Endpoint

**GET** `/api/monitoring/agent-metrics`

Retrieve comprehensive monitoring and analytics data.

#### Query Parameters
- `timeRange`: Time range for metrics (24h, 7d, 30d, 90d)

#### Response Format
```typescript
{
  metrics: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageResponseTime: number;
    cacheHitRate: number;
    topQueries: Array<{
      query: string;
      count: number;
      averageResponseTime: number;
    }>;
    functionUsage: Record<string, number>;
    errorBreakdown: Record<string, number>;
    userEngagement: {
      activeUsers: number;
      averageQueriesPerUser: number;
      retentionRate: number;
    };
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    cache: boolean;
    lastError?: string;
  };
}
```

## Function Calling Patterns

### OpenAI Function Schemas

The agent uses OpenAI function calling to dynamically select and execute financial analysis functions. Each function has a well-defined schema:

```typescript
const functionSchemas = [
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
  // ... additional function schemas
];
```

### Function Execution Flow

1. **Query Processing**: User submits natural language query
2. **Intent Recognition**: OpenAI analyzes query and selects appropriate functions
3. **Parameter Extraction**: OpenAI extracts function parameters from query
4. **Function Execution**: Backend executes selected functions with real database queries
5. **Response Composition**: Agent composes natural language response with insights
6. **Caching**: Successful responses are cached for performance

### Example Function Execution

```typescript
// User Query: "How much did I spend on food last month?"
// OpenAI Function Call:
{
  name: "getSpendingByCategory",
  arguments: {
    category: "food",
    startDate: "2024-01-01",
    endDate: "2024-01-31"
  }
}

// Function Result:
{
  category: "food",
  totalSpent: 450.75,
  transactionCount: 23,
  averageAmount: 19.60,
  topVendors: [
    { vendor: "Starbucks", amount: 89.50, count: 12 },
    { vendor: "Chipotle", amount: 67.25, count: 5 }
  ]
}

// Final Response:
{
  message: "You spent $450.75 on food last month across 23 transactions, averaging $19.60 per transaction. Your top food vendors were Starbucks ($89.50) and Chipotle ($67.25).",
  data: { /* structured data */ },
  insights: [
    "Food spending represents 15% of your total expenses",
    "Consider meal planning to reduce frequent small purchases"
  ]
}
```

## Development Patterns

### Adding New Functions

1. **Define Function Schema**:
```typescript
// In financeFunctions.ts
export async function getNewAnalysis(
  userId: string,
  params: NewAnalysisParams
): Promise<NewAnalysisResult> {
  // Implementation with real database queries
  const results = await prisma.receipt.findMany({
    where: {
      userId,
      // ... query conditions
    }
  });
  
  return {
    // Processed results
  };
}
```

2. **Add to Function Registry**:
```typescript
// In financeAgent.ts
const functionSchemas = [
  // ... existing schemas
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
```

3. **Update Function Mapping**:
```typescript
// In financeAgent.ts
const functionMap = {
  // ... existing mappings
  getNewAnalysis: financeFunctions.getNewAnalysis
};
```

### Error Handling Patterns

```typescript
// Standard error handling in functions
export async function getSpendingByCategory(
  userId: string,
  params: CategoryParams
): Promise<CategoryResult> {
  try {
    // Database query
    const results = await prisma.receipt.findMany({
      where: { userId, category: params.category }
    });
    
    if (!results.length) {
      return {
        category: params.category,
        totalSpent: 0,
        transactionCount: 0,
        message: `No transactions found for category: ${params.category}`
      };
    }
    
    // Process results
    return processedResults;
  } catch (error) {
    console.error('Error in getSpendingByCategory:', error);
    throw new Error(`Failed to analyze spending for category: ${params.category}`);
  }
}
```

### Caching Strategy

```typescript
// Cache key generation
const cacheKey = `agent:${userId}:${query}`;

// Cache TTL: 1 hour for successful responses
await analyticsCache.set(cacheKey, result, 3600);

// Cache retrieval
const cachedResult = await analyticsCache.get<AgentResponse>(cacheKey);
if (cachedResult) {
  return { ...cachedResult, cached: true };
}
```

## Monitoring and Observability

### Logging Patterns

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

### Performance Monitoring

```typescript
// Response time tracking
const startTime = Date.now();
const result = await processQuery();
const responseTime = Date.now() - startTime;

// Cache hit rate monitoring
const cacheStats = await analyticsCache.getStats();
const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
```

### Health Checks

```typescript
// Service health monitoring
const health = await monitoringService.getHealth();
if (health.status === 'unhealthy') {
  // Trigger alerts
  await sendAlert('Agent service is unhealthy', health);
}
```

## Testing Strategies

### Unit Testing

```typescript
// Test individual functions
describe('getSpendingByCategory', () => {
  it('should return correct spending for category', async () => {
    const result = await getSpendingByCategory(userId, {
      category: 'food',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });
    
    expect(result.totalSpent).toBeGreaterThan(0);
    expect(result.category).toBe('food');
  });
});
```

### Integration Testing

```typescript
// Test agent orchestration
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
```

### Component Testing

```typescript
// Test UI components
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

## Deployment Considerations

### Environment Variables

```bash
# Required environment variables
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Performance Optimization

1. **Caching**: 1-hour TTL for successful responses
2. **Concurrent Execution**: Multiple functions execute in parallel
3. **Streaming**: Real-time response streaming for long queries
4. **Database Indexing**: Optimized indexes for common queries

### Security Considerations

1. **Authentication**: All endpoints require valid Supabase session
2. **Rate Limiting**: API rate limiting to prevent abuse
3. **Input Validation**: Comprehensive validation of all inputs
4. **Error Sanitization**: No sensitive data in error messages

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**:
   - Check API key validity
   - Verify rate limits
   - Check network connectivity

2. **Database Connection Issues**:
   - Verify DATABASE_URL
   - Check Prisma client generation
   - Validate database schema

3. **Authentication Errors**:
   - Verify Supabase configuration
   - Check session validity
   - Validate user permissions

### Debugging Tools

1. **Monitoring Dashboard**: Real-time metrics and health status
2. **Log Analysis**: Structured logging for query analysis
3. **Cache Statistics**: Cache hit rates and performance metrics
4. **Error Tracking**: Detailed error reports with context

## Best Practices

### Query Optimization

1. **Use Specific Timeframes**: "last month" vs "recently"
2. **Specify Categories**: "food" vs "spending"
3. **Include Context**: "compared to last year" for comparisons

### Performance Guidelines

1. **Cache Frequently**: Common queries should be cached
2. **Batch Operations**: Group related queries when possible
3. **Optimize Database**: Use proper indexes and query patterns
4. **Monitor Performance**: Track response times and cache hit rates

### Security Guidelines

1. **Validate Inputs**: Sanitize all user inputs
2. **Authenticate Requests**: Verify user sessions
3. **Log Securely**: Don't log sensitive data
4. **Rate Limit**: Prevent abuse and ensure fair usage

---

This documentation provides a comprehensive guide to the AI Financial Assistant Agent system. For additional support, refer to the Master System Guide and the TIER4_UPGRADE_PLAN.md for architectural context and implementation details. 