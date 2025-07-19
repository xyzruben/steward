# Steward - AI-Powered Receipt & Expense Tracker

> **Live Demo**: [https://hellosteward.org](https://hellosteward.org) 🚀

A production-grade, AI-powered receipt and expense tracker designed for individuals and professionals who value faithful financial stewardship. Built with modern full-stack architecture and deployed globally.

## ✨ Overview

Steward automates the tedious process of manual expense tracking by leveraging optical character recognition (OCR) and artificial intelligence to extract, categorize, and analyze receipt data. The application provides intelligent insights that help users make informed financial decisions while maintaining a clean, intuitive interface.

### 🎯 Core Problem Solved

Manual expense tracking is time-consuming, error-prone, and often leads to incomplete financial records. Users struggle with organizing receipts, extracting relevant information, and gaining meaningful insights from their spending patterns.

## 🚀 Live Application

**Production URL**: [https://hellosteward.org](https://hellosteward.org)

The application is fully deployed and operational with:
- ✅ Global CDN via Vercel Edge Network
- ✅ Automated CI/CD pipeline with GitHub Actions
- ✅ Real-time database with Supabase
- ✅ AI-powered receipt processing
- ✅ Responsive design for all devices

## 🛠️ Tech Stack

### Frontend & UI
- **Next.js 15** with App Router for modern React development
- **React 19** for component-based UI architecture
- **TypeScript** with strict mode enforcement
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible, customizable components

### Backend & Database
- **Supabase** for PostgreSQL database, authentication, and file storage
- **Prisma ORM** for type-safe database access and migrations
- **Next.js API Routes** for server-side logic

### AI & Processing
- **OpenAI API** (GPT-4o-mini) for intelligent categorization and analysis
- **Tesseract.js** for optical character recognition
- **Fuse.js** for fuzzy search capabilities

### DevOps & Quality
- **GitHub Actions** for continuous integration and deployment
- **Vercel** for hosting and edge functions
- **Jest** for comprehensive testing
- **Codecov** for test coverage tracking

## 🧠 AI/ML Capabilities

### Intelligent Data Extraction
- **OCR Processing**: Advanced text recognition from receipt images
- **Merchant Detection**: AI-powered merchant name extraction and normalization
- **Amount Parsing**: Precise monetary value extraction with currency handling
- **Date Recognition**: Automatic date parsing from various receipt formats

### Smart Categorization
- **GPT-Powered Analysis**: OpenAI GPT-4o-mini analyzes receipt content for intelligent categorization
- **Contextual Understanding**: AI considers merchant context, items purchased, and spending patterns
- **Confidence Scoring**: Provides confidence levels for categorization accuracy
- **Learning Capabilities**: System improves categorization over time

### Advanced Analytics
- **Spending Pattern Analysis**: AI-driven insights into spending habits
- **Trend Detection**: Identifies recurring expenses and spending trends
- **Predictive Analytics**: Forecasts future spending based on historical data
- **Anomaly Detection**: Flags unusual spending patterns

## 🏗️ Architecture

### Frontend Architecture
- **App Router Structure**: Next.js 15 App Router with server and client components
- **Component Hierarchy**: Feature-based organization with clear separation of concerns
- **State Management**: React Context for global state, local state for UI interactions
- **Performance Optimization**: Server-side rendering, code splitting, and image optimization

### Backend Design
- **API Route Principles**: RESTful conventions with comprehensive validation
- **Server Actions**: Seamless form submissions and data mutations
- **Security**: Row-level security, input validation, and rate limiting
- **Caching Strategy**: Next.js built-in caching with appropriate invalidation

### Database Schema
- **Prisma Modeling**: Type-safe database access with proper relationships
- **Relational Integrity**: Foreign key constraints and cascade operations
- **Indexing Strategy**: Optimized queries with composite indexes
- **Multi-currency Support**: Built-in support for different currencies

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (ARM64 recommended for Apple Silicon)
- **npm** or **yarn**
- **Supabase** account
- **OpenAI API** key

### Local Development Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd steward
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment configuration**:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Analytics and Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

4. **Database setup**:
```bash
npx prisma generate
npx prisma db push
```

5. **Start development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing & Quality Assurance

### Test Coverage
- **79 tests** with 95%+ pass rate
- **Component testing** with React Testing Library
- **API route testing** with realistic scenarios
- **Business logic validation** with comprehensive edge cases

### CI/CD Pipeline
- **Automated testing** on every commit
- **Type checking** and linting enforcement
- **Build verification** and deployment validation
- **Security scanning** for dependency vulnerabilities

### Quality Standards
- **TypeScript strict mode** enforcement
- **ESLint** and **Prettier** for code consistency
- **Accessibility** compliance (WCAG 2.1)
- **Performance optimization** with Lighthouse scores

## 📁 Project Structure

```
steward/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes and server actions
│   │   ├── analytics/         # Analytics dashboard pages
│   │   ├── auth/              # Authentication flows
│   │   ├── profile/           # User profile management
│   │   └── receipts/          # Receipt management pages
│   ├── components/            # React components
│   │   ├── analytics/         # Analytics and reporting
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard and stats
│   │   ├── receipts/          # Receipt management
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and services
│   │   └── services/          # External service integrations
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Project documentation
```

## 🎯 Key Features

### Receipt Management
- **Drag-and-drop upload** with format validation
- **Batch processing** for multiple receipts
- **Automatic data extraction** via OCR and AI
- **Smart categorization** with confidence scoring
- **Search and filtering** with fuzzy matching

### Analytics & Insights
- **Spending analytics** with interactive charts
- **Category breakdown** and trend analysis
- **Merchant insights** and spending patterns
- **Export capabilities** for accounting and tax purposes
- **Real-time updates** with WebSocket integration

### User Experience
- **Responsive design** for all devices
- **Dark mode support** with theme persistence
- **Accessibility compliance** with screen reader support
- **Real-time notifications** for processing status
- **Offline capability** with service worker caching

## 🔒 Security & Privacy

- **Row-level security** with Supabase RLS policies
- **JWT-based authentication** with secure session management
- **Input validation** and sanitization at multiple layers
- **GDPR compliance** with data export and deletion capabilities
- **Encrypted storage** for sensitive financial data

## 🚀 Deployment

The application is deployed using:
- **Vercel** for global CDN and edge functions
- **GitHub Actions** for automated CI/CD
- **Supabase** for production database and authentication
- **Environment-specific** configurations for staging and production

## 👨‍💻 Development

### Built by Ruben Rivas

This project was developed as a showcase of modern full-stack development capabilities, built entirely by a self-taught developer using prompt-driven development via Cursor.

**Development Approach**:
- **Prompt-driven development** with AI assistance
- **Modern architecture** following industry best practices
- **Comprehensive testing** strategy for reliability
- **Performance optimization** for production readiness
- **Accessibility-first** design principles

### Contributing

While this is primarily a showcase project, contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Application**: [https://hellosteward.org](https://hellosteward.org)
- **Documentation**: [Master System Guide](docs/STEWARD_MASTER_SYSTEM_GUIDE.md)
- **CI/CD Setup**: [CI/CD Documentation](docs/CI_CD_SETUP.md)

---

**Steward** - Empowering faithful financial stewardship through intelligent automation. 💰✨
