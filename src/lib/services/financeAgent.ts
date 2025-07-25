import { OpenAI } from 'openai';
import { getSpendingByCategory, getSpendingByTime, getSpendingByVendor, getSpendingForCustomPeriod, getSpendingComparison, detectSpendingAnomalies, getSpendingTrends, summarizeTopVendors, summarizeTopCategories } from './financeFunctions';
import { analyticsCache } from './cache';

// ============================================================================
// FINANCE AGENT - AI-NATIVE FINANCIAL ASSISTANT
// ============================================================================
// Orchestrates OpenAI function calling for intelligent financial analysis.
// Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
// Tier 4: Expanded function registry for custom timeframes, comparisons, anomaly detection, trends, and summaries.
// Performance Optimization: Added caching, streaming responses, and optimized execution.

// -----------------------------
// Types for Agent Responses
// -----------------------------
export interface AgentResponse {
  message: string;
  data: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
}

export interface StreamingAgentResponse {
  type: 'start' | 'function_call' | 'data_processing' | 'summary' | 'complete' | 'error';
  message?: string;
  data?: any;
  insights?: string[];
  error?: string;
  cached?: boolean;
  executionTime?: number;
}

export interface FunctionCall {
  name: string;
  arguments: any;
}

// -----------------------------
// Performance Configuration
// -----------------------------
const PERFORMANCE_CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_FUNCTIONS: 3,
  STREAMING_ENABLED: true,
  CACHE_ENABLED: true,
} as const;

// -----------------------------
// Function Schema Definitions
// -----------------------------
const functionSchemas = [
  {
    name: 'getSpendingByCategory',
    description: 'Get total spending by category for a specific timeframe',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The spending category to analyze (e.g., "Food & Dining", "Transportation")'
        },
        timeframe: {
          type: 'string',
          description: 'Time period to analyze (e.g., "last month", "this year", "last 30 days")'
        }
      },
      required: ['category', 'timeframe']
    }
  },
  {
    name: 'getSpendingByTime',
    description: 'Get spending data for a specific time period',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period to analyze (e.g., "last week", "this month", "last 3 months")'
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'getSpendingByVendor',
    description: 'Get spending data for a specific vendor or merchant',
    parameters: {
      type: 'object',
      properties: {
        vendor: {
          type: 'string',
          description: 'The vendor or merchant name to analyze'
        },
        timeframe: {
          type: 'string',
          description: 'Time period to analyze (e.g., "last month", "this year")'
        }
      },
      required: ['vendor', 'timeframe']
    }
  },
  {
    name: 'getSpendingForCustomPeriod',
    description: 'Get spending data for a custom date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  {
    name: 'getSpendingComparison',
    description: 'Compare spending between two time periods',
    parameters: {
      type: 'object',
      properties: {
        period1: {
          type: 'string',
          description: 'First time period (e.g., "last month", "this year")'
        },
        period2: {
          type: 'string',
          description: 'Second time period (e.g., "previous month", "last year")'
        }
      },
      required: ['period1', 'period2']
    }
  },
  {
    name: 'detectSpendingAnomalies',
    description: 'Detect unusual spending patterns and anomalies',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period to analyze for anomalies (e.g., "this month", "last 30 days")'
        },
        category: {
          type: 'string',
          description: 'Optional category to focus on for anomaly detection'
        },
        vendor: {
          type: 'string',
          description: 'Optional vendor to focus on for anomaly detection'
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'getSpendingTrends',
    description: 'Analyze spending trends over time',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period for trend analysis (e.g., "last 6 months", "this year")'
        },
        interval: {
          type: 'string',
          description: 'Interval for trend analysis (e.g., "weekly", "monthly", "daily")',
          enum: ['daily', 'weekly', 'monthly']
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'summarizeTopVendors',
    description: 'Get summary of top vendors by spending',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period for vendor summary (e.g., "this month", "last 3 months")'
        },
        limit: {
          type: 'number',
          description: 'Number of top vendors to return (default: 10)'
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'summarizeTopCategories',
    description: 'Get summary of top spending categories',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period for category summary (e.g., "this month", "last 3 months")'
        },
        limit: {
          type: 'number',
          description: 'Number of top categories to return (default: 10)'
        }
      },
      required: ['timeframe']
    }
  }
];

// -----------------------------
// Function Registry
// -----------------------------
const functionRegistry = {
  getSpendingByCategory,
  getSpendingByTime,
  getSpendingByVendor,
  getSpendingForCustomPeriod,
  getSpendingComparison,
  detectSpendingAnomalies,
  getSpendingTrends,
  summarizeTopVendors,
  summarizeTopCategories,
};

// -----------------------------
// Finance Agent Class
// -----------------------------
export class FinanceAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Handle user query with performance optimizations
   * Supports both regular and streaming responses
   */
  async handleQuery(
    userQuery: string, 
    userContext: { userId: string },
    options: { streaming?: boolean } = {}
  ): Promise<AgentResponse | AsyncGenerator<StreamingAgentResponse>> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache first (if enabled)
      if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
        const cacheKey = this.generateCacheKey(userQuery, userContext.userId);
        const cachedResult = await analyticsCache.get<AgentResponse>(cacheKey);
        if (cachedResult) {
          return {
            ...cachedResult,
            cached: true,
            executionTime: Date.now() - startTime
          };
        }
      }

      // 2. Handle streaming response
      if (options.streaming && PERFORMANCE_CONFIG.STREAMING_ENABLED) {
        return this.handleQueryStreaming(userQuery, userContext, startTime);
      }

      // 3. Handle regular response
      return await this.handleQueryRegular(userQuery, userContext, startTime);
    } catch (error) {
      console.error('FinanceAgent error:', error);
      const executionTime = Date.now() - startTime;
      
      return {
        message: 'I encountered an error while processing your request. Please try again or rephrase your question.',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
    }
  }

  /**
   * Handle regular (non-streaming) query processing
   */
  private async handleQueryRegular(
    userQuery: string, 
    userContext: { userId: string },
    startTime: number
  ): Promise<AgentResponse> {
    // 1. Prepare system prompt
    const systemPrompt = this.getSystemPrompt();

    // 2. Call OpenAI with function calling enabled
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      tools: functionSchemas.map(schema => ({
        type: 'function' as const,
        function: schema
      })),
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0].message;

    // 3. Handle function calls if present
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const results = await this.executeFunctionsOptimized(
        assistantMessage.tool_calls,
        userContext.userId
      );

      // 4. Get natural language summary from OpenAI
      const summaryCompletion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
          { 
            role: 'assistant', 
            content: `I've analyzed your data using the following functions: ${results.map(r => r.functionName).join(', ')}` 
          },
          {
            role: 'tool',
            tool_call_id: assistantMessage.tool_calls[0].id,
            content: JSON.stringify(results)
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const result: AgentResponse = {
        message: summaryCompletion.choices[0].message.content || 'Analysis complete',
        data: results,
        insights: this.extractInsights(results),
        executionTime: Date.now() - startTime
      };

      // 5. Cache the result
      if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
        const cacheKey = this.generateCacheKey(userQuery, userContext.userId);
        await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
      }

      return result;
    } else {
      // 6. Handle direct response (no function call needed)
      const result: AgentResponse = {
        message: assistantMessage.content || 'I understand your query but don\'t have a specific function to call. Could you rephrase or ask about spending analysis?',
        data: null,
        executionTime: Date.now() - startTime
      };

      // Cache the result
      if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
        const cacheKey = this.generateCacheKey(userQuery, userContext.userId);
        await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
      }

      return result;
    }
  }

  /**
   * Handle streaming query processing
   */
  private async *handleQueryStreaming(
    userQuery: string,
    userContext: { userId: string },
    startTime: number
  ): AsyncGenerator<StreamingAgentResponse> {
    try {
      // 1. Start streaming
      yield {
        type: 'start',
        message: 'Starting analysis...',
        executionTime: Date.now() - startTime
      };

      // 2. Prepare system prompt
      const systemPrompt = this.getSystemPrompt();

      // 3. Call OpenAI with function calling enabled
      yield {
        type: 'function_call',
        message: 'Determining best analysis approach...',
        executionTime: Date.now() - startTime
      };

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        tools: functionSchemas.map(schema => ({
          type: 'function' as const,
          function: schema
        })),
        tool_choice: 'auto',
        temperature: 0.1,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0].message;

      // 4. Handle function calls if present
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        yield {
          type: 'data_processing',
          message: 'Processing your financial data...',
          executionTime: Date.now() - startTime
        };

        const results = await this.executeFunctionsOptimized(
          assistantMessage.tool_calls,
          userContext.userId
        );

        // 5. Get natural language summary from OpenAI
        yield {
          type: 'summary',
          message: 'Generating insights...',
          executionTime: Date.now() - startTime
        };

        const summaryCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery },
            { 
              role: 'assistant', 
              content: `I've analyzed your data using the following functions: ${results.map(r => r.functionName).join(', ')}` 
            },
            {
              role: 'tool',
              tool_call_id: assistantMessage.tool_calls[0].id,
              content: JSON.stringify(results)
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        });

        const result: StreamingAgentResponse = {
          type: 'complete',
          message: summaryCompletion.choices[0].message.content || 'Analysis complete',
          data: results,
          insights: this.extractInsights(results),
          executionTime: Date.now() - startTime
        };

        // 6. Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          const cacheKey = this.generateCacheKey(userQuery, userContext.userId);
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        yield result;
      } else {
        // 7. Handle direct response (no function call needed)
        const result: StreamingAgentResponse = {
          type: 'complete',
          message: assistantMessage.content || 'I understand your query but don\'t have a specific function to call. Could you rephrase or ask about spending analysis?',
          data: null,
          executionTime: Date.now() - startTime
        };

        // Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          const cacheKey = this.generateCacheKey(userQuery, userContext.userId);
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        yield result;
      }
    } catch (error) {
      console.error('FinanceAgent streaming error:', error);
      yield {
        type: 'error',
        message: 'I encountered an error while processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute functions with performance optimizations
   * - Concurrent execution for multiple functions
   * - Error handling for individual functions
   * - Progress tracking
   */
  private async executeFunctionsOptimized(
    toolCalls: any[],
    userId: string
  ): Promise<Array<{ functionName: string; result: any }>> {
    const results: Array<{ functionName: string; result: any }> = [];
    
    // Execute functions in batches for optimal performance
    const batchSize = PERFORMANCE_CONFIG.MAX_CONCURRENT_FUNCTIONS;
    
    for (let i = 0; i < toolCalls.length; i += batchSize) {
      const batch = toolCalls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (toolCall) => {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
                 try {
           if (functionRegistry[functionName as keyof typeof functionRegistry]) {
             const functionResult = await functionRegistry[functionName as keyof typeof functionRegistry]({
               ...functionArgs,
               userId
             });
             return { functionName, result: functionResult };
           }
           return { functionName, result: { error: `Unknown function: ${functionName}` } };
         } catch (error) {
           console.error(`Error executing function ${functionName}:`, error);
           return { functionName, result: { error: `Failed to execute ${functionName}` } };
         }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Generate cache key for queries
   */
  private generateCacheKey(userQuery: string, userId: string): string {
    const normalizedQuery = userQuery.toLowerCase().trim();
    return `agent:${userId}:${Buffer.from(normalizedQuery).toString('base64')}`;
  }

  /**
   * Get system prompt for OpenAI
   */
  private getSystemPrompt(): string {
    return `You are Steward's intelligent financial assistant. You help users understand their spending patterns by analyzing their receipt data.

Key capabilities:
- Analyze spending by category, time period, or vendor
- Compare spending between different time periods
- Detect unusual spending patterns and anomalies
- Show spending trends over time
- Provide summaries of top vendors and categories

Guidelines:
- Always use the most appropriate function for the user's query
- Parse timeframes intelligently (e.g., "last month" = previous calendar month)
- Provide clear, actionable insights
- If a query is ambiguous, ask for clarification
- Focus on financial insights that help users make better decisions

Available functions are registered below. Use them to provide accurate, data-driven responses.`;
  }

  /**
   * Extract insights from function results
   */
  private extractInsights(results: Array<{ functionName: string; result: any }>): string[] {
    const insights: string[] = [];
    
    for (const { functionName, result } of results) {
      if (result && !result.error) {
        switch (functionName) {
          case 'getSpendingByCategory':
            if (result.total > 0) {
              insights.push(`You spent $${result.total.toFixed(2)} on ${result.category}`);
            }
            break;
          case 'detectSpendingAnomalies':
            if (Array.isArray(result) && result.length > 0) {
              insights.push(`Found ${result.length} unusual spending patterns`);
            }
            break;
          case 'getSpendingTrends':
            if (Array.isArray(result) && result.length > 0) {
              insights.push(`Analyzed spending trends over ${result.length} periods`);
            }
            break;
          case 'summarizeTopVendors':
            if (Array.isArray(result) && result.length > 0) {
              insights.push(`Top vendor: ${result[0]?.merchant || 'Unknown'} ($${result[0]?.total?.toFixed(2) || 0})`);
            }
            break;
          case 'summarizeTopCategories':
            if (Array.isArray(result) && result.length > 0) {
              insights.push(`Top category: ${result[0]?.category || 'Unknown'} ($${result[0]?.total?.toFixed(2) || 0})`);
            }
            break;
        }
      }
    }
    
    return insights;
  }

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    const keysToDelete = analyticsCache.getStats().keys.filter(key => 
      key.startsWith(`agent:${userId}:`)
    );
    keysToDelete.forEach(key => analyticsCache.delete(key));
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return analyticsCache.getStats();
  }
} 