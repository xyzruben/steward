// ============================================================================
// ENHANCED FINANCE AGENT - AI-First Architecture
// ============================================================================
// Optimized for maximum AI performance with enhanced caching, streaming, and request deduplication
// Focuses on core AI functionality with optimized execution

import { OpenAI } from 'openai';
import { prisma } from '../prisma';
import { agentCache } from './cache';
import * as financeFunctions from './financeFunctions';

// Inline timeframe parser to avoid import issues in CI/CD
function parseTimeframe(timeframe: string): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const normalizedTimeframe = timeframe.toLowerCase().trim();
  
  switch (normalizedTimeframe) {
    case 'last month':
      return {
        start: new Date(currentYear, currentMonth - 1, 1),
        end: new Date(currentYear, currentMonth, 0)
      };
    
    case 'this month':
      return {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0)
      };
    
    case 'last week':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 7);
      return {
        start: lastWeekStart,
        end: now
      };
    
    case 'last 3 months':
      const last3MonthsStart = new Date(now);
      last3MonthsStart.setMonth(now.getMonth() - 3);
      return {
        start: last3MonthsStart,
        end: now
      };
    
    case 'last 6 months':
      const last6MonthsStart = new Date(now);
      last6MonthsStart.setMonth(now.getMonth() - 6);
      return {
        start: last6MonthsStart,
        end: now
      };
    
    case 'this year':
      return {
        start: new Date(currentYear, 0, 1),
        end: new Date(currentYear, 11, 31)
      };
    
    case 'last year':
      return {
        start: new Date(currentYear - 1, 0, 1),       
        end: new Date(currentYear - 1, 11, 31)
      };
    
    default:
      // Default to last 90 days for better data coverage
      const defaultStart = new Date(now);
      defaultStart.setDate(now.getDate() - 90);
      return {
        start: defaultStart,
        end: now
      };
  }
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
      const functionResults: any[] = [];
      if (functionCalls.length > 0) {
        yield { type: 'function_call', message: 'Executing financial analysis...' };
        
        for (const toolCall of functionCalls) {
          try {
            const result = await this.executeFunction(toolCall.function, userId);
            functionResults.push({ functionName: toolCall.function.name, result });
            yield { type: 'data_processing', data: result };
          } catch (error) {
            yield { type: 'error', error: error instanceof Error ? error.message : 'Function execution failed' };
          }
        }
      }

      // Generate meaningful response based on function results
      const meaningfulMessage = this.generateMeaningfulResponse(query, functionResults, assistantMessage);
      
      yield { 
        type: 'complete', 
        message: meaningfulMessage,
        data: functionResults.length > 0 ? functionResults[0].result : null,
        insights: this.extractInsights(functionResults),
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

    return await this.formatResponse(completion, userId);
  }

  private generateCacheKey(query: string, userId: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    return `ai:${userId}:${normalizedQuery.substring(0, 100)}`;
  }

  private getSystemPrompt(): string {
    return `You are an AI financial assistant that helps users understand their spending patterns and financial data. You have access to various financial functions to analyze their data.

IMPORTANT FUNCTION SELECTION RULES:
- Use 'getSpendingByVendor' when the user asks about a specific merchant/vendor (e.g., "Tierra Mia Coffee Company", "Chick-fil-A", "Starbucks")
- Use 'getSpendingByCategory' when the user asks about a general category (e.g., "coffee", "food", "gas") without mentioning specific merchants
- Use 'getSpendingByTime' when the user asks about total spending in a time period
- Use 'getTopMerchants' when the user asks about top spending merchants

CRITICAL TIMEFRAME GUIDELINES:
- For vendor queries without a specific timeframe, default to "this year" to ensure comprehensive data coverage
- For category queries without a specific timeframe, use "last 3 months" for recent trends
- If the user doesn't specify a timeframe, choose a broad enough range to capture relevant spending data
- Avoid using very narrow timeframes (like "last week") unless specifically requested
- Remember that users may have data going back several months, so be inclusive

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
          description: 'Get total spending by general category (e.g., "coffee", "food", "gas") for a specific timeframe. Use this for broad category analysis, not specific merchants.',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The general spending category to analyze (e.g., "coffee", "food", "gas")'
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
      },
      {
        type: 'function' as const,
        function: {
          name: 'getSpendingByVendor',
          description: 'Get total spending by specific vendor/merchant name (e.g., "Tierra Mia Coffee Company", "Chick-fil-A"). Use this for specific merchant queries with fuzzy matching support.',
          parameters: {
            type: 'object',
            properties: {
              vendor: {
                type: 'string',
                description: 'The vendor/merchant name to search for (e.g., "Chick-fil-A", "chick fil a", "Tierra Mia"). Supports fuzzy matching for variations.'
              },
              timeframe: {
                type: 'string',
                description: 'Time period to analyze. For vendor queries without user-specified timeframe, use "this year" to ensure comprehensive data coverage. Examples: "this year", "last 3 months", "july"'
              }
            },
            required: ['vendor', 'timeframe']
          }
        }
      }
    ];
  }

  private async executeFunction(functionCall: any, userId: string): Promise<any> {
    const { name, arguments: args } = functionCall;
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    try {
      switch (name) {
        case 'getSpendingByCategory':
          return await financeFunctions.getSpendingByCategory({
            userId,
            category: parsedArgs.category,
            timeframe: parsedArgs.timeframe
          });
        
        case 'getSpendingByTime':
          // Parse timeframe string into Date objects
          if (!parsedArgs.timeframe) {
            throw new Error('Timeframe parameter is required for getSpendingByTime');
          }
          const timeframe = parseTimeframe(parsedArgs.timeframe);
          return await financeFunctions.getSpendingByTime({
            userId,
            timeframe
          });
        
        case 'getTopMerchants':
          if (!parsedArgs.timeframe) {
            throw new Error('Timeframe parameter is required for getTopMerchants');
          }
          return await financeFunctions.summarizeTopVendors({
            userId,
            timeframe: parseTimeframe(parsedArgs.timeframe),
            N: parsedArgs.limit
          });
        
        case 'getSpendingByVendor':
          if (!parsedArgs.vendor || !parsedArgs.timeframe) {
            throw new Error('Vendor and timeframe parameters are required for getSpendingByVendor');
          }
          console.log(`🔍 AI calling getSpendingByVendor with:`, {
            vendor: parsedArgs.vendor,
            timeframe: parsedArgs.timeframe
          });
          return await financeFunctions.getSpendingByVendor({
            userId,
            vendor: parsedArgs.vendor,
            timeframe: parseTimeframe(parsedArgs.timeframe)
          });
        
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      throw error;
    }
  }

  private async formatResponse(completion: any, userId: string): Promise<AgentResponse> {
    const message = completion.choices[0]?.message;
    if (!message) {
      return {
        message: 'I encountered an error processing your request.',
        data: null,
        error: 'No response from AI model'
      };
    }

    let data = null;
    let functionsUsed: string[] = [];
    const functionResults: Array<{ functionName: string; result: any }> = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Handle function calls
      functionsUsed = message.tool_calls.map((call: any) => call.function.name);
      
      console.log(`🔍 AI called functions:`, functionsUsed);
      
      // Execute function calls and collect results
      for (const toolCall of message.tool_calls) {
        try {
          console.log(`🔍 Executing function: ${toolCall.function.name} with args:`, toolCall.function.arguments);
          const result = await this.executeFunction(toolCall.function, userId);
          functionResults.push({ functionName: toolCall.function.name, result });
          if (!data) data = result; // Use first result as primary data
        } catch (error) {
          console.error(`Error executing function ${toolCall.function.name}:`, error);
        }
      }
    }

    // Generate meaningful message
    const meaningfulMessage = this.generateMeaningfulResponse('', functionResults, message.content || '');

    return {
      message: meaningfulMessage,
      data,
      functionsUsed,
      insights: this.extractInsights(functionResults)
    };
  }

  private generateMeaningfulResponse(query: string, functionResults: Array<{ functionName: string; result: any }>, assistantMessage: string): string {
    // If there's already a meaningful assistant message, use it
    if (assistantMessage && assistantMessage.trim() !== '') {
      return assistantMessage;
    }

    // Generate response based on function results
    if (functionResults.length === 0) {
      return 'I couldn\'t find any relevant financial data for your query. Please try asking about a specific category or time period.';
    }

    const result = functionResults[0].result;
    const functionName = functionResults[0].functionName;

    switch (functionName) {
      case 'getSpendingByCategory':
        if (result && result.total !== undefined) {
          const amount = result.total === 0 ? '$0' : `$${result.total.toFixed(2)}`;
          const category = result.category || 'this category';
          const timeframe = this.extractTimeframeFromQuery(query);
          
          if (result.total > 0) {
            return `You spent ${amount} on ${category}${timeframe}. This includes receipts from coffee shops and related merchants.`;
          } else {
            return `You spent ${amount} on ${category}${timeframe}. Note: This search includes both categorized receipts and receipts from coffee-related merchants.`;
          }
        }
        break;
      
      case 'getSpendingByTime':
        if (result && result.total !== undefined) {
          const amount = result.total === 0 ? '$0' : `$${result.total.toFixed(2)}`;
          const timeframe = this.extractTimeframeFromQuery(query);
          return `Your total spending${timeframe} was ${amount}.`;
        }
        break;
      
      case 'getTopMerchants':
        if (result && result.merchants && result.merchants.length > 0) {
          const topMerchant = result.merchants[0];
          const timeframe = this.extractTimeframeFromQuery(query);
          return `Your top merchant${timeframe} was ${topMerchant.merchant} with $${topMerchant.total.toFixed(2)} in spending.`;
        }
        break;
      
      case 'getSpendingByVendor':
        if (result && result.total !== undefined) {
          const amount = result.total === 0 ? '$0' : `$${result.total.toFixed(2)}`;
          const vendor = result.vendor || 'this vendor';
          const timeframe = this.extractTimeframeFromQuery(query);
          
          if (result.total > 0) {
            return `You spent ${amount} at ${vendor}${timeframe}.`;
          } else {
            return `You spent ${amount} at ${vendor}${timeframe}.`;
          }
        }
        break;
    }

    return 'Analysis complete. Check the data section below for detailed results.';
  }

  private extractTimeframeFromQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('july 2025')) return ' in July 2025';
    if (lowerQuery.includes('last month')) return ' last month';
    if (lowerQuery.includes('this month')) return ' this month';
    if (lowerQuery.includes('last week')) return ' last week';
    if (lowerQuery.includes('this year')) return ' this year';
    if (lowerQuery.includes('last year')) return ' last year';
    return '';
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