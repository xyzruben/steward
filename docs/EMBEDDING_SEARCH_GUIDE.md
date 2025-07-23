# Embedding Search (RAG) Feature Guide

## 🧠 Overview

Steward now includes AI-powered semantic search capabilities using vector embeddings and Retrieval-Augmented Generation (RAG). This feature allows users to search their receipts using natural language queries, providing more intuitive and intelligent insights into their spending patterns.

## ✨ Key Features

### Natural Language Search
- **Semantic Understanding**: Search for receipts using conversational queries
- **Context Awareness**: AI understands spending context and patterns
- **Fuzzy Matching**: Find receipts even with imprecise descriptions

### Spending Insights
- **Intelligent Analytics**: AI-generated insights from spending patterns
- **Category Analysis**: Automatic breakdown of spending by category
- **Merchant Insights**: Identify top merchants and spending trends

### AI-Powered Search
- **Semantic Search**: Natural language queries with intelligent understanding
- **Spending Insights**: AI-generated analytics and pattern recognition

## 🚀 How to Use

### AI-Powered Search Interface

1. Navigate to the **Receipts** page
2. Use the AI-powered search interface for natural language queries

### Natural Language Queries

Try these example queries in AI-Powered Search mode:

#### Basic Queries
- "What did I spend on food last month?"
- "Show me all my coffee purchases"
- "How much did I spend on transportation?"
- "Find receipts from grocery stores"

#### Specific Queries
- "What are my biggest expenses?"
- "Show me dining out expenses"
- "How much did I spend on gas?"
- "Find all Amazon purchases"

#### Merchant Queries
- "What did I buy at Target?"
- "Show me receipts from Starbucks"
- "Find all purchases from Walmart"

#### Category Queries
- "Show me entertainment expenses"
- "What did I spend on clothing?"
- "Find all travel-related receipts"

### Spending Insights Mode

Switch to **Insights** mode to get AI-generated analytics:

1. Click the **Insights** button in the search interface
2. Ask questions like:
   - "Analyze my food spending patterns"
   - "What are my spending trends this year?"
   - "Show me insights about my restaurant spending"

## 🏗️ Technical Implementation

### Architecture

```
User Query → OpenAI Embeddings → Vector Similarity → Results
     ↓
Receipt Data → Embedding Generation → Database Storage
```

### Components

1. **EmbeddingsService** (`src/lib/services/embeddings.ts`)
   - Generates vector embeddings for receipt content
   - Performs semantic similarity search
   - Calculates cosine similarity between vectors

2. **SemanticSearch Component** (`src/components/search/SemanticSearch.tsx`)
   - React component for natural language search
   - Dual mode: Search and Insights
   - Real-time results display

3. **API Routes**
   - `/api/search/semantic` - Semantic search endpoint
   - `/api/embeddings/generate` - Embedding generation endpoint

4. **Database Schema**
   - `ReceiptEmbedding` model for storing vector embeddings
   - 1536-dimensional vectors using OpenAI text-embedding-3-small

### Data Flow

1. **Receipt Upload**: When a receipt is uploaded, embeddings are automatically generated
2. **Content Creation**: Rich content is created from receipt data (merchant, amount, category, summary, etc.)
3. **Embedding Generation**: OpenAI generates 1536-dimensional vectors
4. **Storage**: Embeddings are stored in PostgreSQL with the receipt
5. **Search**: User queries are converted to embeddings and compared using cosine similarity

## 🔧 Configuration

### Environment Variables

Ensure these are set in your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
```

### Database Migration

The embedding feature requires a database migration:

```bash
npx prisma migrate dev --name add_receipt_embeddings
```

### Generating Embeddings for Existing Receipts

For existing receipts without embeddings:

```bash
# Generate embeddings for all user receipts
curl -X POST /api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{}'

# Generate embedding for specific receipt
curl -X POST /api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"receiptId": "receipt-uuid"}'
```

## 📊 Performance Considerations

### Embedding Generation
- **Cost**: OpenAI text-embedding-3-small costs ~$0.00002 per 1K tokens
- **Speed**: ~100ms per embedding generation
- **Storage**: ~6KB per embedding (1536 floats × 4 bytes)

### Search Performance
- **Similarity Calculation**: O(n) where n is number of user receipts
- **Threshold Filtering**: Configurable similarity threshold (default: 0.7)
- **Result Limiting**: Configurable result limit (default: 10)

### Optimization Strategies
- **Batch Processing**: Embeddings generated asynchronously during receipt upload
- **Caching**: Similarity calculations cached for repeated queries
- **Indexing**: Database indexes on embedding metadata for faster filtering

## 🧪 Testing

Run the embedding service tests:

```bash
npm test -- embeddings.test.ts
```

## 🔒 Security & Privacy

### Data Protection
- **User Isolation**: Embeddings are user-specific and isolated
- **Row-Level Security**: Supabase RLS policies protect embedding data
- **No Cross-User Access**: Embeddings cannot be accessed across users

### API Security
- **Authentication Required**: All embedding endpoints require user authentication
- **Rate Limiting**: Semantic search is rate-limited to prevent abuse
- **Input Validation**: All queries are validated and sanitized

## 🚀 Future Enhancements

### Planned Features
- **Conversational AI**: Chat-like interface for spending queries
- **Predictive Analytics**: AI-powered spending predictions
- **Smart Categorization**: Improved category suggestions based on embeddings
- **Multi-language Support**: Embeddings for different languages

### Performance Improvements
- **Vector Database**: Migration to specialized vector database (Pinecone, Weaviate)
- **Approximate Nearest Neighbor**: Faster similarity search algorithms
- **Embedding Compression**: Reduced storage requirements

## 📚 API Reference

### Semantic Search Endpoint

```typescript
GET /api/search/semantic?q=query&limit=10&threshold=0.7

Response:
{
  results: Array<{
    receiptId: string
    similarity: number
    content: string
    metadata: {
      merchant: string
      category?: string
      amount: number
      date: string
      summary?: string
    }
  }>
  query: string
  count: number
  metadata: {
    timestamp: string
    threshold: number
    limit: number
  }
}
```

### Spending Insights Endpoint

```typescript
POST /api/search/semantic

Body: { query: string }

Response:
{
  insights: {
    insights: Array<SemanticSearchResult>
    totalAmount: number
    averageAmount: number
    topCategories: Array<{
      category: string
      count: number
      totalAmount: number
    }>
    topMerchants: Array<{
      merchant: string
      count: number
      totalAmount: number
    }>
    count: number
  }
  query: string
  metadata: {
    timestamp: string
    generatedAt: string
  }
}
```

## 🎯 Best Practices

### Query Optimization
- **Be Specific**: "coffee from Starbucks" vs "coffee"
- **Use Categories**: "food expenses" vs "restaurants"
- **Include Time**: "last month" vs "recent"

### Performance Tips
- **Batch Operations**: Generate embeddings for multiple receipts at once
- **Regular Updates**: Regenerate embeddings when receipt data changes
- **Monitor Usage**: Track OpenAI API usage and costs

### User Experience
- **Clear Instructions**: Provide example queries to users
- **Progressive Disclosure**: Show advanced features gradually
- **Feedback Loops**: Allow users to refine search results

---

**Steward Embedding Search** - Empowering intelligent financial insights through AI-powered semantic search! 🧠✨ 