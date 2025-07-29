// ============================================================================
// ENHANCED FINANCE AGENT - AI-First Architecture
// ============================================================================
// Optimized for maximum AI performance with enhanced caching, streaming, and request deduplication
// Focuses on core AI functionality with optimized execution

import { OpenAI } from 'openai';
import { prisma } from '../prisma';
import { agentCache } from './cache';
import * as financeFunctions from './financeFunctions';

// Helper function to parse timeframe strings
function parseTimeframe(timeframe: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  
  switch (timeframe.toLowerCase()) {
    case 'last week':
      start.setDate(now.getDate() - 7);
      break;
    case 'last month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'last 3 months':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'last 6 months':
      start.setMonth(now.getMonth() - 6);
      break;
    case 'this year':
      start.setMonth(0, 1);
      break;
    case 'last year':
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      break;
    default:
      start.setDate(now.getDate() - 30); // Default to last 30 days
  }
  
  return { start, end: now };
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

export interface QueryOptions {
  forceRefresh?: boolean;
  streaming?: boolean;
  maxTokens?: number;
}

// ============================================================================
// PERFORMANCE CONFIGURATION
// ============================================================================

const PERFORMANCE_CONFIG = {
  CACHE_TTL: 10 * 60 * 1000, // 10 minutes (increased from 5)
  MAX_CONCURRENT_FUNCTIONS: 5, // Increased from 3
  STREAMING_ENABLED: true,
  CACHE_ENABLED: true,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
} as const;

// ============================================================================
// ENHANCED FINANCE AGENT CLASS
// ============================================================================

export class FinanceAgent {
  private cache: typeof agentCache;
  private openai: OpenAI;
  private requestQueue: Map<string, Promise<AgentResponse>> = new Map();

  constructor() {
    this.cache = agentCache;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: PERFORMANCE_CONFIG.MAX_RETRIES,
      timeout: PERFORMANCE_CONFIG.REQUEST_TIMEOUT
    });
  }

  // ============================================================================
  // MAIN QUERY PROCESSING - ENHANCED WITH CACHING AND DEDUPLICATION
  // ============================================================================

  async processQuery(query: string, userId: string, options: QueryOptions = {}): Promise<AgentResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query, userId);
    
    try {
      // Check cache first (unless force refresh)
      if (PERFORMANCE_CONFIG.CACHE_ENABLED && !options.forceRefresh) {
        const cached = await this.cache.get(cacheKey);
                 if (cached && typeof cached === 'object' && 'message' in cached) {
           return {
             message: (cached as any).message || 'Cached response',
             data: (cached as any).data || null,
             insights: (cached as any).insights || [],
             cached: true,
             executionTime: Date.now() - startTime
           };
         }
      }

      // Deduplicate concurrent requests
      if (this.requestQueue.has(cacheKey)) {
        const result = await this.requestQueue.get(cacheKey)!;
        return {
          ...result,
          executionTime: Date.now() - startTime
        };
      }

      // Process the query
      const requestPromise = this.processQueryDirectly(query, userId, options);
      this.requestQueue.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;
        
        // Cache the result
        if (PERFORMANCE_CONFIG.CACHE_ENABLED) {
          await this.cache.set(cacheKey, result, { ttl: PERFORMANCE_CONFIG.CACHE_TTL });
        }
        
        return {
          ...result,
          executionTime: Date.now() - startTime
        };
      } finally {
        this.requestQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error('FinanceAgent error:', error);
      return {
        message: 'I encountered an error while processing your request.',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  // ============================================================================
  // ENHANCED STREAMING QUERY PROCESSING
  // ============================================================================

  async *streamQuery(query: string, userId: string): AsyncGenerator<StreamingAgentResponse> {
    const startTime = Date.now();
    
    try {
      yield { type: 'start', message: 'Analyzing your request...' };

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: query }
        ],
        tools: this.getFunctionSchemas(),
        tool_choice: 'auto',
        stream: true,
        max_tokens: 2000,
        temperature: 0.1,
      });

      let assistantMessage = '';
      const functionCalls: any[] = [];

      for await (const chunk of completion) {
        const choice = chunk.choices[0];
        if (!choice) continue;

                 // Handle content
         if (choice.delta.content) {
           assistantMessage += choice.delta.content;
           yield { type: 'data_processing', message: choice.delta.content };
         }

        // Handle function calls
        if (choice.delta.tool_calls) {
          for (const toolCall of choice.delta.tool_calls) {
            if (toolCall.function) {
              const existingCall = functionCalls[toolCall.index];
              if (existingCall) {
                existingCall.function.arguments += toolCall.function.arguments || '';
              } else {
                functionCalls[toolCall.index] = {
                  index: toolCall.index,
                  function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments || ''
                  }
                };
              }
            }
          }
        }
      }

      // Execute function calls if any
      if (functionCalls.length > 0) {
        yield { type: 'function_call', message: 'Executing financial analysis...' };
        
        for (const toolCall of functionCalls) {
          try {
            const result = await this.executeFunction(toolCall.function, userId);
            yield { type: 'data_processing', data: result };
          } catch (error) {
            yield { type: 'error', error: error instanceof Error ? error.message : 'Function execution failed' };
          }
        }
      }

      yield { 
        type: 'complete', 
        message: assistantMessage || 'Analysis complete.',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Streaming error:', error);
      yield { 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Streaming failed',
        executionTime: Date.now() - startTime
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS - ENHANCED IMPLEMENTATION
  // ============================================================================

  private async processQueryDirectly(query: string, userId: string, options: QueryOptions): Promise<AgentResponse> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: query }
      ],
      tools: this.getFunctionSchemas(),
      tool_choice: 'auto',
      max_tokens: options.maxTokens || 2000,
      temperature: 0.1,
    });

    return this.formatResponse(completion, userId);
  }

  private generateCacheKey(query: string, userId: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    return `ai:${userId}:${normalizedQuery.substring(0, 100)}`;
  }

  private getSystemPrompt(): string {
    return `You are an AI financial assistant that helps users understand their spending patterns and financial data. You have access to various financial functions to analyze their data.

Key capabilities:
- Analyze spending by category, merchant, and time periods
- Provide insights on spending patterns
- Answer questions about financial data
- Generate summaries and recommendations

Always be helpful, accurate, and provide actionable insights. Use the available functions to get real data when needed.`;
  }

  private getFunctionSchemas() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'getSpendingByCategory',
          description: 'Get total spending by category for a specific timeframe',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The spending category to analyze'
              },
              timeframe: {
                type: 'string',
                description: 'Time period to analyze (e.g., "last month", "this year")'
              }
            },
            required: ['category', 'timeframe']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'getSpendingByTime',
          description: 'Get spending data for a specific time period',
          parameters: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                description: 'Time period to analyze'
              }
            },
            required: ['timeframe']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'getTopMerchants',
          description: 'Get top merchants by spending amount',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of merchants to return'
              },
              timeframe: {
                type: 'string',
                description: 'Time period to analyze'
              }
            },
            required: ['limit', 'timeframe']
          }
        }
      }
    ];
  }

  private async executeFunction(functionCall: any, userId: string): Promise<any> {
    const { name, arguments: args } = functionCall;
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    switch (name) {
      case 'getSpendingByCategory':
        return await financeFunctions.getSpendingByCategory({
          userId,
          category: parsedArgs.category,
          timeframe: parsedArgs.timeframe
        });
      
      case 'getSpendingByTime':
        return await financeFunctions.getSpendingByTime({
          userId,
          timeframe: parsedArgs.timeframe
        });
      
             case 'getTopMerchants':
         return await financeFunctions.summarizeTopVendors({
           userId,
           timeframe: parseTimeframe(parsedArgs.timeframe),
           N: parsedArgs.limit
         });
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private formatResponse(completion: any, userId: string): AgentResponse {
    const message = completion.choices[0]?.message;
    if (!message) {
      return {
        message: 'I encountered an error processing your request.',
        data: null,
        error: 'No response from AI model'
      };
    }

    const data = null;
    let functionsUsed: string[] = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Handle function calls
      functionsUsed = message.tool_calls.map((call: any) => call.function.name);
      // Note: Function results would be handled in the streaming version
    }

    return {
      message: message.content || 'Analysis complete.',
      data,
      functionsUsed,
      insights: this.extractInsights([])
    };
  }

  private extractInsights(results: Array<{ functionName: string; result: any }>): string[] {
    // Enhanced insight extraction based on function results
    const insights: string[] = [];
    
    for (const { functionName, result } of results) {
      if (functionName === 'getSpendingByCategory' && result.total > 0) {
        insights.push(`You spent $${result.total.toFixed(2)} on ${result.category} in the selected period.`);
      }
    }
    
    return insights;
  }

  // ============================================================================
  // STATIC UTILITY METHODS
  // ============================================================================

  static clearUserCache(userId: string): void {
    agentCache.clearUserSync(userId);
  }

  static getCacheStats() {
    return agentCache.getStats();
  }
} 