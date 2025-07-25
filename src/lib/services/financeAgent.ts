import { OpenAI } from 'openai';
import { prisma } from '../prisma';
import { analyticsCache } from './cache';
import { monitoringService } from './monitoring';
import * as financeFunctions from './financeFunctions';

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
  functionsUsed?: string[];
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
  getSpendingByCategory: financeFunctions.getSpendingByCategory,
  getSpendingByTime: financeFunctions.getSpendingByTime,
  getSpendingByVendor: financeFunctions.getSpendingByVendor,
  getSpendingForCustomPeriod: financeFunctions.getSpendingForCustomPeriod,
  getSpendingComparison: financeFunctions.getSpendingComparison,
  detectSpendingAnomalies: financeFunctions.detectSpendingAnomalies,
  getSpendingTrends: financeFunctions.getSpendingTrends,
  summarizeTopVendors: financeFunctions.summarizeTopVendors,
  summarizeTopCategories: financeFunctions.summarizeTopCategories,
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
    query: string,
    userId: string,
    streaming: boolean = false,
    metadata?: Record<string, any>
  ): Promise<AgentResponse | AsyncGenerator<StreamingAgentResponse>> {
    const startTime = Date.now();
    let functionsUsed: string[] = [];
    let success = false;
    let error: string | undefined;
    let cached = false;

    try {
      // Check cache first
      const cacheKey = `agent:${userId}:${query}`;
      const cachedResult = await analyticsCache.get<AgentResponse>(cacheKey);
      
      if (cachedResult) {
        cached = true;
        success = true;
        
        // Log cached response
        await monitoringService.logAgentQuery(
          userId,
          query,
          Date.now() - startTime,
          success,
          functionsUsed,
          cached,
          error,
          metadata
        );
        
        return cachedResult;
      }

      if (streaming) {
        return this.handleQueryStreaming(query, userId, startTime, metadata);
      } else {
        const result = await this.handleQueryRegular(query, userId, startTime, metadata);
        success = true;
        functionsUsed = result.functionsUsed || [];
        
        // Cache successful response
        await analyticsCache.set(cacheKey, result, 3600); // 1 hour
        
        // Log successful response
        await monitoringService.logAgentQuery(
          userId,
          query,
          Date.now() - startTime,
          success,
          functionsUsed,
          cached,
          error,
          metadata
        );
        
        return result;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      success = false;
      
      // Log error
      await monitoringService.logAgentQuery(
        userId,
        query,
        Date.now() - startTime,
        success,
        functionsUsed,
        cached,
        error,
        metadata
      );
      
      throw err;
    }
  }

  /**
   * Handle regular (non-streaming) query processing
   */
  private async handleQueryRegular(
    query: string,
    userId: string,
    startTime: number,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    const functionsUsed: string[] = [];
    const cacheKey = `agent:${userId}:${query}`;
    
    try {
      // 1. Prepare system prompt
      const systemPrompt = this.getSystemPrompt();

      // 2. Call OpenAI with function calling enabled
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial assistant that helps users analyze their spending patterns. You have access to various financial data functions. Use them to provide accurate, helpful responses. Always provide insights and explanations with your data.`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        functions: functionSchemas,
        function_call: 'auto',
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Track function calls
      if (response.function_call) {
        functionsUsed.push(response.function_call.name);
      }

      // 3. Handle function calls if present
      if (response.tool_calls && response.tool_calls.length > 0) {
        const results = await this.executeFunctionsOptimized(
          response.tool_calls,
          userId
        );

        // 4. Generate final response with function results
        const finalCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
            { 
              role: 'assistant', 
              content: response.content || '',
              tool_calls: response.tool_calls
            },
            {
              role: 'tool',
              tool_call_id: response.tool_calls[0].id,
              content: JSON.stringify(results)
            }
          ],
          temperature: 0.1,
        });

        const finalResponse = finalCompletion.choices[0]?.message;
        const result: AgentResponse = {
          message: finalResponse?.content || 'Analysis complete',
          data: results,
          insights: this.extractInsights(results),
          executionTime: Date.now() - startTime,
          functionsUsed,
        };

        // 5. Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        return result;
      } else {
        // 6. Handle direct response (no function call needed)
        const result: AgentResponse = {
          message: response.content || 'I understand your query but don\'t have a specific function to call. Could you rephrase or ask about spending analysis?',
          data: null,
          executionTime: Date.now() - startTime,
          functionsUsed,
        };

        // Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        return result;
      }
    } catch (err) {
      // Log error with context
      await monitoringService.logError(
        userId,
        query,
        err instanceof Error ? err.message : 'Unknown error',
        {
          functionsUsed,
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
        },
        err instanceof Error ? err.stack : undefined
      );
      
      throw err;
    }
  }

  /**
   * Handle streaming query processing
   */
  private async *handleQueryStreaming(
    query: string,
    userId: string,
    startTime: number,
    metadata?: Record<string, any>
  ): AsyncGenerator<StreamingAgentResponse> {
    const functionsUsed: string[] = [];
    
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
          { role: 'user', content: query }
        ],
        tools: functionSchemas.map(schema => ({
          type: 'function' as const,
          function: schema
        })),
        tool_choice: 'auto',
        temperature: 0.1,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Track function calls in streaming
      if (response.function_call) {
        functionsUsed.push(response.function_call.name);
      }

      // 4. Handle function calls if present
      if (response.tool_calls && response.tool_calls.length > 0) {
        yield {
          type: 'data_processing',
          message: 'Processing your financial data...',
          executionTime: Date.now() - startTime
        };

        const results = await this.executeFunctionsOptimized(
          response.tool_calls,
          userId
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
            { role: 'user', content: query },
            { 
              role: 'assistant', 
              content: `I've analyzed your data using the following functions: ${results.map(r => r.functionName).join(', ')}` 
            },
            {
              role: 'tool',
              tool_call_id: response.tool_calls[0].id,
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
          executionTime: Date.now() - startTime,
        };

        // 6. Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          const cacheKey = `agent:${userId}:${query}`;
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        yield result;
      } else {
        // 7. Handle direct response (no function call needed)
        const result: StreamingAgentResponse = {
          type: 'complete',
          message: response.content || 'I understand your query but don\'t have a specific function to call. Could you rephrase or ask about spending analysis?',
          data: null,
          executionTime: Date.now() - startTime,
        };

        // Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          const cacheKey = `agent:${userId}:${query}`;
          await analyticsCache.set(cacheKey, result, PERFORMANCE_CONFIG.CACHE_TTL);
        }

        yield result;
      }
    } catch (err) {
      // Log streaming error
      await monitoringService.logError(
        userId,
        query,
        err instanceof Error ? err.message : 'Unknown error',
        {
          functionsUsed,
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
        },
        err instanceof Error ? err.stack : undefined
      );
      
      throw err;
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