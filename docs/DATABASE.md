# Steward Database Setup

This document outlines the database architecture and setup for Steward, an AI-powered receipt and expense tracker.

## Architecture Overview

Steward uses:
- **PostgreSQL** via Supabase for the database
- **Prisma ORM** for type-safe database operations
- **UUID primary keys** for security and scalability
- **Row Level Security (RLS)** ready design for multi-tenancy

## Database Schema

### User Model
- Maps to Supabase Auth users
- Uses UUID primary key for RLS integration
- Stores basic profile information

### Receipt Model
- Core entity for receipt data
- Stores OCR text, AI summaries, and metadata
- Includes performance indexes for common queries
- Decimal precision for currency amounts

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Supabase (add when setting up Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (add when setting up OpenAI integration)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Migration

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Or create and run migrations (production)
pnpm db:migrate
```

### 3. Seed Database (Development)

```bash
# Seed with sample data
pnpm db:seed
```

## Development Workflow

### Available Commands

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:studio` - Open Prisma Studio for database management
- `pnpm db:reset` - Reset database and run migrations
- `pnpm db:seed` - Seed database with sample data

### Database Operations

All database operations are centralized in `src/lib/db.ts`:

```typescript
import { createUser, createReceipt, getReceiptsByUserId } from '@/lib/db'

// Create a user
const user = await createUser({
  id: 'user-uuid',
  email: 'user@example.com',
  name: 'John Doe'
})

// Create a receipt
const receipt = await createReceipt({
  userId: user.id,
  imageUrl: 'https://example.com/receipt.jpg',
  rawText: 'Receipt text...',
  merchant: 'Starbucks',
  total: 12.50,
  purchaseDate: new Date()
})

// Get user's receipts
const receipts = await getReceiptsByUserId(user.id, {
  take: 20,
  orderBy: 'purchaseDate',
  order: 'desc'
})
```

## Extensibility

The schema is designed for future extensions:

### Categories
- Uncomment the Category model in `prisma/schema.prisma`
- Add categoryId to Receipt model
- Run migration

### Tags
- Uncomment the Tag and ReceiptTag models
- Implement many-to-many relationship
- Run migration

### Additional Features
- Receipt items/line items
- Expense categories
- Budget tracking
- Export functionality

## Security Considerations

### Row Level Security (RLS)
- User model designed for RLS integration
- All queries filter by userId
- UUID primary keys prevent enumeration attacks

### Data Validation
- Prisma schema enforces data types
- Application layer validates input
- Decimal precision for currency amounts

## Performance Optimization

### Indexes
- `userId` index for user-specific queries
- `purchaseDate` index for date-based filtering
- `merchant` index for merchant searches

### Query Optimization
- Use `select` to limit returned fields
- Implement pagination with `skip`/`take`
- Use `include` for related data when needed

## Testing

### Unit Tests
- Mock Prisma client for isolated testing
- Test database operations in isolation
- Validate data transformations

### Integration Tests
- Use test database for end-to-end testing
- Reset database between test runs
- Test with real Prisma operations

## Production Deployment

### Migration Strategy
1. Create migration: `pnpm db:migrate`
2. Review generated migration file
3. Deploy: `pnpm db:migrate:deploy`
4. Generate client: `pnpm db:generate`

### Monitoring
- Monitor query performance
- Track database connection usage
- Set up alerts for failed migrations

## Troubleshooting

### Common Issues

1. **Prisma Client not generated**
   ```bash
   pnpm db:generate
   ```

2. **Migration conflicts**
   ```bash
   pnpm db:reset  # Development only
   ```

3. **Connection issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Validate credentials

### Debug Commands

```bash
# View database schema
pnpm db:studio

# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate
``` 