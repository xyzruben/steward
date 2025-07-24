import { getSpendingByCategory, getSpendingByTime, getSpendingByVendor } from './financeFunctions';
// import OpenAI client and types as needed

/**
 * Orchestrates the AI-native financial assistant agent.
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 */
export class FinanceAgent {
  /**
   * Handles a user query using OpenAI function calling and returns insights.
   * @param userQuery Natural language query from the user
   * @param userContext Authenticated user context (userId, etc.)
   */
  async handleQuery(userQuery: string, userContext: { userId: string }) {
    // 1. Prepare system prompt referencing Master System Guide
    const systemPrompt = `You are Steward's financial assistant. Follow the Master System Guide (docs/STEWARD_MASTER_SYSTEM_GUIDE.md). Use only registered functions. Respond with clear, actionable insights.`;

    // 2. Register callable functions
    const functionRegistry = [
      getSpendingByCategory,
      getSpendingByTime,
      getSpendingByVendor,
      // Add more functions as needed
    ];

    // 3. Prepare OpenAI function calling payload
    // TODO: Integrate with OpenAI client, pass systemPrompt, userQuery, and functionRegistry

    // 4. Handle OpenAI function call response
    // TODO: Parse function call, execute corresponding function, handle errors

    // 5. Compose and return structured + natural language response
    // TODO: Format result for UI consumption
    return {
      message: 'TODO: Implement OpenAI function calling and response handling',
      data: null,
    };
  }
}

// TODO: Add unit tests and integration tests for FinanceAgent 