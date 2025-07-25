import { OpenAI } from 'openai';
import { getSpendingByCategory, getSpendingByTime, getSpendingByVendor, getSpendingForCustomPeriod, getSpendingComparison, detectSpendingAnomalies, getSpendingTrends, summarizeTopVendors, summarizeTopCategories } from './financeFunctions';

// ============================================================================
// FINANCE AGENT - AI-NATIVE FINANCIAL ASSISTANT
// ============================================================================
// Orchestrates OpenAI function calling for intelligent financial analysis.
// Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
// Tier 4: Expanded function registry for custom timeframes, comparisons, anomaly detection, trends, and summaries.

// -----------------------------
// Types for Agent Responses
// -----------------------------
export interface AgentResponse {
  message: string;
  data: any;
  insights?: string[];
  error?: string;
}

export interface FunctionCall {
  name: string;
  arguments: any;
}

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
        periodA: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date for period A (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date for period A (YYYY-MM-DD)' }
          },
          required: ['startDate', 'endDate']
        },
        periodB: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date for period B (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date for period B (YYYY-MM-DD)' }
          },
          required: ['startDate', 'endDate']
        },
        category: {
          type: 'string',
          description: 'Optional category to filter comparison'
        }
      },
      required: ['periodA', 'periodB']
    }
  },
  {
    name: 'detectSpendingAnomalies',
    description: 'Detect unusual spending patterns or anomalies',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period to analyze for anomalies (e.g., "last month", "last 3 months")'
        },
        category: {
          type: 'string',
          description: 'Optional category to focus anomaly detection on'
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'getSpendingTrends',
    description: 'Get spending trends over time',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          description: 'Time period to analyze trends (e.g., "last 6 months", "this year")'
        },
        interval: {
          type: 'string',
          description: 'Data aggregation interval (e.g., "day", "week", "month")',
          enum: ['day', 'week', 'month']
        },
        category: {
          type: 'string',
          description: 'Optional category to focus trend analysis on'
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
          description: 'Time period to analyze (e.g., "last month", "this year")'
        },
        limit: {
          type: 'number',
          description: 'Number of top vendors to return (default: 5)'
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
          description: 'Time period to analyze (e.g., "last month", "this year")'
        },
        limit: {
          type: 'number',
          description: 'Number of top categories to return (default: 5)'
        }
      },
      required: ['timeframe']
    }
  }
];

// -----------------------------
// Function Registry Mapping
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

/**
 * Orchestrates the AI-native financial assistant agent.
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 * Tier 4: Expanded function registry for custom timeframes, comparisons, anomaly detection, trends, and summaries.
 */
export class FinanceAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Handles a user query using OpenAI function calling and returns insights.
   * @param userQuery Natural language query from the user
   * @param userContext Authenticated user context (userId, etc.)
   */
  async handleQuery(userQuery: string, userContext: { userId: string }): Promise<AgentResponse> {
    try {
      // 1. Prepare system prompt referencing Master System Guide
      const systemPrompt = `You are Steward's intelligent financial assistant. You help users understand their spending patterns by analyzing their receipt data.

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
        temperature: 0.1, // Low temperature for consistent function selection
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0].message;

      // 3. Handle function calls if present
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const results = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          // Execute the corresponding function
          if (functionRegistry[functionName as keyof typeof functionRegistry]) {
            const functionResult = await functionRegistry[functionName as keyof typeof functionRegistry]({
              ...functionArgs,
              userId: userContext.userId
            });
            results.push({ functionName, result: functionResult });
          }
        }

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

        return {
          message: summaryCompletion.choices[0].message.content || 'Analysis complete',
          data: results,
          insights: this.extractInsights(results)
        };
      } else {
        // 5. Handle direct response (no function call needed)
        return {
          message: assistantMessage.content || 'I understand your query but don\'t have a specific function to call. Could you rephrase or ask about spending analysis?',
          data: null
        };
      }
    } catch (error) {
      console.error('FinanceAgent error:', error);
      return {
        message: 'I encountered an error while processing your request. Please try again or rephrase your question.',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extracts key insights from function results for UI display
   */
  private extractInsights(results: Array<{ functionName: string; result: any }>): string[] {
    const insights: string[] = [];
    
    for (const { functionName, result } of results) {
      switch (functionName) {
        case 'getSpendingByCategory':
          if (result.total > 0) {
            insights.push(`Total spending in ${result.category}: $${result.total.toFixed(2)}`);
          }
          break;
        case 'detectSpendingAnomalies':
          if (result.length > 0) {
            insights.push(`Found ${result.length} spending anomalies to review`);
          }
          break;
        case 'getSpendingComparison':
          if (result.difference !== 0) {
            const trend = result.difference > 0 ? 'increased' : 'decreased';
            insights.push(`Spending ${trend} by $${Math.abs(result.difference).toFixed(2)} compared to previous period`);
          }
          break;
        case 'summarizeTopVendors':
          if (result.length > 0) {
            insights.push(`Top vendor: ${result[0].vendor} ($${result[0].total.toFixed(2)})`);
          }
          break;
      }
    }
    
    return insights;
  }
}

// ============================================================================
// All agent code is documented and validated per STEWARD_MASTER_SYSTEM_GUIDE.md
// ============================================================================ 