# Steward: Master System Guide

## 1. Project Purpose and Vision

**Steward** is a production-grade, AI-powered receipt and expense tracker designed for individuals and professionals who value faithful financial stewardship. The application automates the tedious process of manual expense tracking by leveraging optical character recognition (OCR) and artificial intelligence to extract, categorize, and analyze receipt data.

**Core Problem Solved:**
Manual expense tracking is time-consuming, error-prone, and often leads to incomplete financial records. Users struggle with organizing receipts, extracting relevant information, and gaining meaningful insights from their spending patterns.

**Primary Use Cases:**
- Receipt capture through photo upload or file import
- Automated data extraction using OCR technology
- Intelligent categorization and tagging of expenses
- Historical analysis and spending pattern identification
- Secure storage and retrieval of financial documents
- Export capabilities for accounting and tax purposes

**Long-term Vision:**
Steward aspires to become the definitive platform for personal and small business financial stewardship, offering intelligent insights that help users make informed financial decisions. The platform will scale to support enterprise-level expense management while maintaining the personal touch that distinguishes it from corporate expense systems.

## 2. Tech Stack Overview

**Frontend Framework:**
- Next.js 15 with App Router for modern React development, server-side rendering, and optimal performance
- React 19 for component-based UI architecture and state management

**Language and Type Safety:**
- TypeScript with strict mode enforcement for compile-time error detection and enhanced developer experience
- Comprehensive type definitions for all API responses, component props, and data models

**Styling and UI Components:**
- Tailwind CSS for utility-first styling and rapid UI development
- shadcn/ui for accessible, customizable component primitives that maintain design consistency

**Backend and Database:**
- Supabase for PostgreSQL database, authentication, and file storage
- Prisma ORM for type-safe database access, migrations, and schema management

**AI and Processing:**
- tesseract.js for optical character recognition of receipt images
- OpenAI API (gpt-4o-mini) for intelligent categorization, summarization, and data enrichment
- Fuse.js for fuzzy search capabilities across receipt data

**Testing and Quality:**
- Jest for unit testing and test runner
- React Testing Library for component testing and user behavior simulation

**DevOps and Deployment:**
- GitHub Actions for continuous integration and deployment pipelines
- Vercel for hosting, edge functions, and global content delivery

**Future Dependencies:**
- TODO: Consider adding React Query or SWR for server state management
- TODO: Evaluate monitoring solutions (Sentry, LogRocket)
- TODO: Assess need for job queue systems (Bull, Redis) for OCR processing

## 3. System Architecture

### Frontend Architecture

**App Router Structure:**
The application follows Next.js 15 App Router conventions with all routes organized under the app directory. Server Components are used by default for improved performance and SEO, while Client Components are reserved for interactive elements requiring client-side state or browser APIs.

**Component Hierarchy:**
Components are organized by feature and responsibility, with clear separation between presentational components, container components, and utility functions. The layout system provides consistent navigation and authentication state across all pages.

**Data Fetching Patterns:**
Server Components handle initial data fetching for improved performance and SEO. Client-side data fetching occurs only when necessary for real-time updates or user interactions. All data fetching includes proper error handling and loading states.

**Caching Strategy:**
Next.js built-in caching mechanisms are leveraged for static content and API responses. Dynamic data is cached appropriately based on update frequency and user requirements.

### Backend/API Design

**API Route Principles:**
All API routes follow RESTful conventions and are organized by feature. Each route includes comprehensive input validation, error handling, and appropriate HTTP status codes. Authentication is enforced on all protected endpoints.

**Server Actions:**
Server Actions are used for form submissions and data mutations, providing seamless integration between client and server while maintaining type safety and validation.

**Security Considerations:**
All server-side operations validate user permissions and sanitize inputs. API keys and sensitive credentials are never exposed to the client. Rate limiting is implemented to prevent abuse.

### Database Schema Design

**Prisma Modeling:**
The database schema is designed with scalability and performance in mind. All models include proper indexing, foreign key relationships, and timestamp fields for auditing. The schema supports future extensibility for features like categories, tags, and multi-currency support.

**Relational Integrity:**
Foreign key constraints ensure data consistency across related tables. Cascade delete operations are implemented where appropriate to maintain referential integrity.

**Indexing Strategy:**
Database indexes are created on frequently queried fields such as user IDs, dates, and searchable text fields. Composite indexes are used for complex queries involving multiple criteria.

### Receipt Ingestion Workflow

**Upload Process:**
Receipt images are uploaded to Supabase Storage with proper access controls and metadata. File validation ensures only supported formats are processed.

**OCR Processing:**
tesseract.js extracts text from receipt images asynchronously. The extracted text is cleaned and structured before being passed to the AI categorization system.

**AI Categorization:**
OpenAI API analyzes the extracted text to identify merchants, amounts, dates, and categories. The AI provides confidence scores and alternative interpretations when appropriate.

**Data Persistence:**
Extracted and enriched data is stored in PostgreSQL with proper validation and error handling. All operations are wrapped in database transactions to ensure data consistency.

### Authentication and Authorization

**Supabase Auth Integration:**
User authentication is handled entirely through Supabase Auth, providing secure JWT-based sessions and user management. The authentication flow includes proper error handling and user feedback.

**Row Level Security:**
RLS policies ensure users can only access their own data. All database queries are filtered by user ID to prevent unauthorized access to sensitive financial information.

**Session Management:**
User sessions are managed securely with proper token refresh and logout handling. Session state is synchronized between Supabase Auth and the application's user context.

### State Management

**React State Patterns:**
Local component state is used for UI interactions and form data. Global state is managed through React Context for authentication and user preferences.

**Server State Caching:**
TODO: Define approach for caching server state and handling data revalidation

**Internationalization and Accessibility:**
TODO: Define requirements for multi-language support and accessibility compliance

## 4. Scalability and Performance

**Concurrent Upload Handling:**
The system is designed to handle multiple simultaneous uploads through asynchronous processing and queue management. File uploads are processed independently to prevent blocking.

**OCR and AI Processing Scale:**
OCR and AI processing are implemented as background tasks to prevent user interface blocking. Processing queues can be scaled horizontally as user volume increases.

**Database Query Optimization:**
All database queries are optimized to avoid N+1 problems through proper use of Prisma's include and select features. Pagination is implemented for large result sets.

**File Storage Optimization:**
Receipt images are compressed and stored efficiently in Supabase Storage. Metadata is indexed for fast retrieval and search operations.

**Edge vs. Serverless Considerations:**
The application leverages Vercel's edge functions for global performance while using serverless functions for compute-intensive operations like OCR and AI processing.

**Rate Limiting and Validation:**
API endpoints implement rate limiting to prevent abuse and ensure fair resource allocation. Input validation occurs at multiple layers to prevent invalid data from reaching the database.

## 5. Testing and Quality Assurance

**Test Isolation Strategy:**
All tests use comprehensive global mocks defined in `jest.setup.js` to ensure complete isolation from external dependencies. This approach eliminates flaky tests and ensures consistent behavior across all environments.

**Global Mock Architecture:**
- **Prisma Client**: All database operations are mocked with realistic responses
- **Supabase Services**: Authentication, storage, and real-time features are mocked
- **External APIs**: OpenAI, OCR services, and third-party integrations are mocked
- **Service Layers**: Analytics, export, notifications, and business logic services are mocked
- **Browser APIs**: File uploads, clipboard, and other browser-specific features are mocked

**Unit Testing Strategy:**
All critical business logic, utility functions, and API routes must have comprehensive unit tests. Test coverage targets 80% for critical paths and 60% overall. Tests focus on business logic rather than infrastructure setup.

**Component Testing:**
React components are tested using React Testing Library to ensure they behave correctly from a user perspective. Tests focus on user interactions, accessibility, and component behavior rather than implementation details.

**API Route Testing:**
API routes are tested with realistic request/response scenarios. Tests validate:
- Authentication and authorization flows
- Input validation and error handling
- Business logic execution
- Response formatting and status codes
- Rate limiting and security measures

**Mocking Best Practices:**
- **Single Source of Truth**: All mocks defined in `jest.setup.js`
- **Consistent Behavior**: Same mock implementations across all tests
- **Realistic Data**: Mock responses simulate real-world scenarios
- **Error Conditions**: Comprehensive error handling and edge cases
- **Performance**: Fast execution without external dependencies

**Test File Structure:**
```
src/
├── __tests__/                    # Test utilities and helpers
├── app/api/*/__tests__/         # API route tests
├── components/*/__tests__/      # Component tests
├── lib/services/__tests__/      # Service layer tests
└── jest.setup.js               # Global test configuration
```

**Test Naming Conventions:**
- API tests: `route.test.ts` or `[endpoint].test.ts`
- Component tests: `[ComponentName].test.tsx`
- Service tests: `[ServiceName].test.ts`
- Utility tests: `[utilityName].test.ts`

**CI/CD Pipeline:**
The GitHub Actions pipeline includes:
1. **Linting**: ESLint and Prettier validation
2. **Type Checking**: TypeScript compilation verification
3. **Unit Tests**: Jest with comprehensive coverage reporting
4. **Integration Tests**: End-to-end workflow validation
5. **Security Scanning**: Dependency vulnerability checks

**Test Execution:**
- **Local Development**: `npm test` for fast feedback
- **CI/CD**: `npm run test:ci` for comprehensive validation
- **Coverage**: `npm run test:coverage` for detailed reporting
- **Watch Mode**: `npm run test:watch` for development iteration

**Quality Gates:**
- All tests must pass before deployment
- Coverage thresholds enforced (80% critical paths, 60% overall)
- No flaky tests allowed in main branch
- Performance benchmarks for critical paths

**Manual QA Processes:**
All features undergo manual testing before release, including:
- Cross-browser compatibility testing
- Mobile responsiveness validation
- Accessibility compliance verification
- User acceptance testing
- Performance testing under load

**E2E Testing Strategy:**
TODO: Implement end-to-end testing using Playwright for critical user journeys:
- User registration and authentication
- Receipt upload and processing workflow
- Analytics and reporting features
- Export functionality
- Bulk operations

**Test Data Management:**
- **Mock Data**: Realistic test data defined in test files
- **Fixtures**: Reusable test data for common scenarios
- **Factories**: Dynamic test data generation for edge cases
- **Cleanup**: Automatic cleanup after each test to prevent interference

**Performance Testing:**
- **Load Testing**: API endpoints under realistic load
- **Memory Testing**: Component rendering performance
- **Bundle Analysis**: Frontend bundle size optimization
- **Database Query Optimization**: Query performance validation

**Security Testing:**
- **Authentication Testing**: Proper auth flow validation
- **Authorization Testing**: Role-based access control
- **Input Validation**: SQL injection and XSS prevention
- **Rate Limiting**: Abuse prevention mechanisms
- **Data Privacy**: GDPR compliance validation

## 6. TypeScript Standards

**Strict Mode Enforcement:**
TypeScript strict mode is enabled and enforced across the entire codebase. No exceptions are allowed without explicit justification and documentation.

**Type Safety Requirements:**
The use of 'any' types is prohibited except in rare cases where external libraries require it. All such exceptions must be documented with clear justification.

**Advanced Type Patterns:**
Discriminated unions are used for complex state management and API responses. Generics are employed for reusable components and utility functions.

**API Response Typing:**
All API responses are strongly typed with explicit interfaces. Error responses include proper error codes and messages.

**Asynchronous Type Safety:**
All asynchronous operations use proper TypeScript patterns for handling promises, async/await, and error handling.

## 7. Security Requirements

**Authentication and Authorization:**
All user actions are validated against the current user's permissions. Session tokens are validated on every request to protected resources.

**Input Validation:**
All user inputs are validated and sanitized at multiple layers. API endpoints validate request bodies, query parameters, and headers.

**Environment Variable Security:**
Sensitive configuration values are stored in environment variables and never committed to version control. Different environments use separate configuration files.

**File Access Controls:**
Receipt files are stored with proper access controls ensuring only the owner can view their files. File URLs are signed and expire after a reasonable time.

**Data Privacy Compliance:**
The application is designed to comply with GDPR and other privacy regulations. User data can be exported and deleted upon request.

**Secure Error Handling:**
Error messages are sanitized to prevent information leakage. Internal errors are logged for debugging while user-facing messages are generic and helpful.

## 8. Code Quality and Conventions

**Naming Conventions:**
Components use PascalCase naming, while functions, variables, and files use camelCase. Constants use UPPER_SNAKE_CASE. Database tables and columns use snake_case.

**Folder Organization:**
The codebase follows a feature-based organization with clear separation of concerns. Shared utilities are placed in lib directories, while feature-specific code is co-located.

**Function and File Length:**
Functions should not exceed 50 lines, and files should not exceed 300 lines. Longer functions and files should be refactored into smaller, more focused units.

**Linting and Formatting:**
ESLint and Prettier configurations enforce consistent code style across the project. Pre-commit hooks ensure all code meets quality standards.

**Documentation Requirements:**
All public APIs, complex functions, and business logic must include JSDoc comments. Inline comments explain non-obvious code decisions and complex algorithms.

**Code Review Process:**
All code changes require review by at least one other developer. Reviews focus on functionality, security, performance, and adherence to coding standards.

## 9. Prompting and AI Workflows

**Guide Reference Requirements:**
All AI-assisted code generation must explicitly reference this master system guide. Prompts should include specific sections relevant to the task at hand.

**Architecture Validation:**
Generated code must be validated against the architectural patterns and conventions defined in this guide. Any deviations must be justified and documented.

**Testing Requirements:**
All AI-generated code must include comprehensive tests following the test isolation strategy:
- Use global mocks from `jest.setup.js`
- Focus on business logic rather than infrastructure
- Include error handling and edge cases
- Follow established test naming conventions
- Ensure proper test coverage for critical paths

**Inline Commentary Standards:**
All AI-generated code must include inline comments explaining how the implementation aligns with this guide's requirements and design decisions.

**Quality Assurance:**
Generated code must pass all linting, type checking, and testing requirements before being accepted into the codebase. Tests must be isolated and reliable.

## 10. Monitoring and Observability

**Application Logging:**
Structured logging is implemented throughout the application with appropriate log levels. Logs include correlation IDs for tracking requests across services.

**Error Monitoring:**
Application errors are captured and reported to monitoring services with sufficient context for debugging. Error alerts are configured for critical issues.

**Performance Monitoring:**
Key performance metrics are collected and monitored, including response times, database query performance, and resource utilization.

**Tools and Services:**
TODO: Specify monitoring tools and services to be used (e.g., Sentry, LogRocket, Vercel Analytics)

## 11. Documentation and Developer Experience

**Internal Documentation:**
All major features and architectural decisions are documented in the codebase. Documentation is kept up-to-date with code changes.

**README Requirements:**
The project README includes clear setup instructions, development guidelines, and contribution information. Environment setup is automated where possible.

**Contributor Onboarding:**
New contributors receive comprehensive onboarding documentation and access to development resources. Mentorship programs ensure knowledge transfer.

**Contribution Guidelines:**
TODO: Define detailed contribution guidelines and pull request templates

## 12. Future Enhancements and Roadmap

**Feature Expansions:**
Planned features include multi-currency support, integration with accounting software, recurring expense detection, and advanced analytics dashboards.

**Scalability Improvements:**
Future architectural improvements include implementing job queues for background processing, adding Redis for caching, and optimizing database queries for larger datasets.

**Long-term Goals:**
The platform aims to support enterprise-level expense management while maintaining the personal touch that distinguishes it from corporate solutions. Integration with financial planning tools and tax preparation software is planned.

**Refactor Objectives:**
As the application grows, planned refactors include modularizing the codebase into microservices, implementing event-driven architecture, and optimizing the frontend for better performance and user experience. 