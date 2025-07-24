# Steward Tier 4 Upgrade Plan: AI-Native Financial Assistant

## 1. Agent Role & Responsibilities

**Steward’s Financial Assistant Agent** will serve as an intelligent, conversational interface for users to:
- Accept natural language queries about spending, trends, anomalies, and summaries
- Interpret intent and parameters using OpenAI function calling
- Query, aggregate, and analyze receipt/expense data from the database
- Return actionable insights in both natural language and structured formats
- Integrate seamlessly into the dashboard UI for real-time, interactive analysis

**Key Responsibilities:**
- Intent recognition and parameter extraction (e.g., timeframes, categories, vendors)
- Dynamic function selection and execution (aggregation, filtering, anomaly detection)
- Secure, permissioned data access per user
- Composable, context-aware responses (insights, charts, summaries)
- Error handling, fallback strategies, and user guidance

---

## 2. Core Architecture Changes & Additions

- **Agent Service Layer:**
  - New backend module (e.g., `financeAgent.ts`) encapsulating agent logic, OpenAI orchestration, and function registry
- **OpenAI Function Calling Integration:**
  - Define and register callable functions (e.g., `getSpendingByCategory`, `detectAnomalies`, `summarizeVendors`)
  - Map user queries to function calls and arguments
- **API Endpoint:**
  - Secure RESTful/edge route (e.g., `/api/agent/query`) for agent requests
  - Handles user auth, context, and streaming responses
- **Database Access Layer:**
  - Extend existing Prisma services for flexible, parameterized queries
  - Add aggregation, comparison, and anomaly detection utilities
- **Frontend Integration:**
  - Dashboard UI components for agent chat, insights display, and structured result rendering
  - Real-time feedback, loading, and error states

---

## 3. APIs & Modules to Build

- `src/lib/services/financeAgent.ts`  
  - Core agent orchestration, OpenAI function calling, and response formatting
- `src/app/api/agent/query/route.ts`  
  - API route for agent queries, user context, and streaming
- `src/lib/services/financeFunctions.ts`  
  - Registry of callable functions (spending analysis, anomaly detection, summaries)
- `src/components/agent/AgentChat.tsx`  
  - UI for user queries, chat history, and result display
- **Supporting modules:**
  - Enhanced Prisma query utilities (aggregation, filtering)
  - Prompt templates and system instructions (aligning with Master System Guide)

---

## 4. OpenAI Function Calling Strategy

- **Function Registry:**
  - Define a set of composable, well-typed functions for all supported financial queries
  - Each function includes schema, validation, and documentation
- **Prompt Engineering:**
  - System prompt references Master System Guide and available functions
  - User query + context sent to OpenAI with function registry
- **Execution Flow:**
  1. User submits query
  2. Agent sends prompt and function registry to OpenAI (function calling enabled)
  3. OpenAI selects function(s) and arguments
  4. Backend executes function(s), returns results
  5. Agent composes natural language + structured response
  6. UI renders insights, summaries, and charts
- **Fallbacks:**
  - If function call fails or is ambiguous, agent requests clarification or provides best-effort response

---

## 5. Milestone Roadmap

**MVP (Weeks 1-2):**
- [ ] Implement `financeAgent.ts` with OpenAI function calling
- [ ] Build core function registry: spending by category, time, vendor
- [ ] Create `/api/agent/query` endpoint with user auth
- [ ] Develop minimal AgentChat UI for dashboard
- [ ] End-to-end test: "How much did I spend on X last month?"

**Feature Complete (Weeks 3-5):**
- [ ] Add anomaly detection, trend analysis, and summaries
- [ ] Expand function registry (custom timeframes, comparisons)
- [ ] Enhance UI: streaming, error states, structured result cards
- [ ] Add logging, monitoring, and analytics for agent usage
- [ ] Documentation and developer onboarding

**Polish & Launch (Weeks 6+):**
- [ ] E2E and edge case testing
- [ ] Accessibility and internationalization
- [ ] Performance optimization (streaming, caching)
- [ ] User feedback loop and continuous improvement

---

## 6. Testing, Edge Cases, and Model Limitations

- **Testing:**
  - Isolate agent logic with unit and integration tests (mock OpenAI, DB)
  - Use realistic user queries and edge cases
  - Follow Master System Guide: minimal mocks, business logic focus, test isolation
- **Edge Cases:**
  - Ambiguous or unsupported queries (agent requests clarification)
  - Large data sets (pagination, summarization)
  - Permission errors, missing data, or malformed requests
  - OpenAI/model failures (fallbacks, user messaging)
- **Model Limitations:**
  - Function calling accuracy may vary; always validate arguments
  - Natural language responses may require post-processing for clarity
  - Rate limits and latency (handle gracefully in UI and backend)

---

## 7. Design Best Practices

- **Modularity:**
  - Separate agent orchestration, function registry, and DB access
  - Decouple UI from agent logic for testability
- **Type Safety:**
  - Strong TypeScript types for all agent functions, API responses, and DB models
- **Documentation:**
  - JSDoc for all public APIs and complex logic
  - Inline comments referencing Master System Guide sections
- **Security:**
  - Enforce user auth and row-level security on all agent queries
  - Sanitize all user input and model outputs
- **Observability:**
  - Structured logging for agent requests, errors, and performance
  - Monitor OpenAI usage and fallback rates
- **Quality Assurance:**
  - All code and tests must adhere to Master System Guide standards
  - Code review required for all agent-related changes

---

**This plan is the canonical reference for all Tier 4 AI-native development. All implementation, testing, and review must align with the Steward Master System Guide and the standards set forth above.** 