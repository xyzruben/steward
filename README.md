# Steward - AI-First Receipt & Expense Tracker

> **Live Demo**: [https://hellosteward.org](https://hellosteward.org) 🚀

A production-grade, **AI-First** receipt and expense tracker designed for individuals and professionals who value faithful financial stewardship. Built with a **Foundation-First, AI-Optimized** architecture that prioritizes solid infrastructure validation before AI enhancement.

## ✨ **AI-First Architecture Overview**

Steward implements a **Foundation-First, AI-Optimized** approach that transforms traditional CRUD applications into intelligent, AI-powered financial assistants. The system validates all critical infrastructure before AI optimization, ensuring reliable performance and user experience.

### 🎯 **Core AI-First Principles**

1. **Foundation-First Validation** - All critical infrastructure validated before AI enhancement
2. **AI-First Performance** - Optimized AI agent operations for speed and reliability  
3. **Balanced Architecture** - Enhanced existing codebase without over-engineering
4. **Production-Ready Quality** - All code passes CI/CD and deploys successfully
5. **Continuous Monitoring** - Health checks and validation at every stage

### 🚀 **AI-First vs Traditional CRUD**

| Traditional CRUD App | **Steward AI-First** |
|---------------------|---------------------|
| Manual data entry | **AI-powered OCR extraction** |
| Basic categorization | **Intelligent merchant matching** |
| Simple search | **Natural language semantic search** |
| Static reports | **AI-generated insights and analysis** |
| Manual expense tracking | **Automated receipt processing** |
| Basic filtering | **Contextual AI recommendations** |

## 🧠 **AI/ML Capabilities**

### **Intelligent Data Extraction & Processing**
- **Advanced OCR Processing** - Google Cloud Vision for precise text recognition
- **AI-Powered Merchant Detection** - Intelligent merchant name extraction and normalization
- **Smart Amount Parsing** - Precise monetary value extraction with multi-currency support
- **Contextual Date Recognition** - Automatic date parsing from various receipt formats

### **AI-Driven Categorization System**
- **Intelligent Category Mapping** - Shared `CATEGORY_MAPPINGS` for consistent categorization
- **Merchant-Based Matching** - Smart keyword matching for automatic categorization
- **Batch Re-categorization** - One-click processing of existing uncategorized receipts
- **Confidence Scoring** - AI-powered confidence levels for categorization accuracy

### **Enhanced AI Agent (FinanceAgent)**
- **Streaming Responses** - Real-time AI analysis with progress feedback
- **Request Deduplication** - Prevents duplicate processing for identical queries
- **Intelligent Caching** - 10-minute cache TTL with user-specific invalidation
- **Function Calling** - Direct integration with financial analysis functions
- **Context-Aware Responses** - AI generates meaningful insights from data

### **Natural Language Processing**
- **Conversational Queries** - "How much did I spend on coffee last month?"
- **Semantic Understanding** - AI comprehends intent, not just keywords
- **Contextual Responses** - AI provides insights, not just data
- **Multi-Function Analysis** - AI combines multiple data sources for comprehensive answers

## 🏗️ **AI-First Architecture**

### **Foundation Layer**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Middleware│  │ Rate Limiter│  │ Auth Check  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼──────┐ ┌──▼──┐ ┌──────▼──────┐
            │  AI Service  │ │CRUD │ │Health Check │
            │              │ │Svc  │ │Service      │
            │ • FinanceAgent│ │     │ │             │
            │ • OpenAI API │ │     │ │             │
            │ • Functions  │ │     │ │             │
            │ • Caching    │ │     │ │             │
            └──────────────┘ └─────┘ └─────────────┘
                    │           │           │
            ┌───────▼──────┐ ┌──▼──┐ ┌──────▼──────┐
            │   In-Memory  │ │Post │ │   Simple    │
            │   Cache      │ │greSQL│ │   Logging   │
            └──────────────┘ └─────┘ └─────────────┘
```

### **AI Service Layer**
- **Enhanced FinanceAgent** - Optimized for maximum AI performance
- **Intelligent Caching** - 10-minute TTL with user-specific invalidation
- **Streaming Responses** - Real-time AI analysis with progress feedback
- **Request Deduplication** - Prevents duplicate processing
- **Function Integration** - Direct access to financial analysis functions

### **Foundation Validation System**
- **Comprehensive Health Checks** - Database, Storage, OCR, AI services
- **Production Monitoring** - Real-time validation of critical services
- **Automated Testing** - Foundation validation scripts for CI/CD
- **Error Recovery** - Graceful failure management and rollback procedures

## 🚀 **Live Application**

**Production URL**: [https://hellosteward.org](https://hellosteward.org)

The application is fully deployed and operational with:
- ✅ **Global CDN** via Vercel Edge Network
- ✅ **Automated CI/CD** pipeline with GitHub Actions
- ✅ **Real-time database** with Supabase
- ✅ **AI-powered receipt processing** with intelligent categorization
- ✅ **Foundation validation** with 80% test success rate
- ✅ **Responsive design** for all devices

## 🛠️ **Tech Stack**

### **Frontend & UI**
- **Next.js 15** with App Router for modern React development
- **React 19** for component-based UI architecture
- **TypeScript** with strict mode enforcement
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for accessible, customizable components

### **Backend & Database**
- **Supabase** for PostgreSQL database, authentication, and file storage
- **Prisma ORM** for type-safe database access and migrations
- **Next.js API Routes** for server-side logic

### **AI & Processing**
- **OpenAI API** (GPT-4o-mini) for intelligent categorization and analysis
- **OpenAI Embeddings** (text-embedding-3-small) for semantic search and RAG
- **Google Cloud Vision** for optical character recognition
- **Fuse.js** for fuzzy search capabilities

### **DevOps & Quality**
- **GitHub Actions** for continuous integration and deployment
- **Vercel** for hosting and edge functions
- **Jest** for comprehensive testing
- **Foundation Validation** for production monitoring

## 🎯 **Key Features**

### **AI-Powered Receipt Management**
- **Drag-and-drop upload** with format validation
- **AI-powered OCR extraction** via Google Cloud Vision
- **Intelligent categorization** with merchant-based matching
- **Batch re-categorization** for existing receipts
- **Semantic search** with natural language queries

### **Enhanced AI Agent**
- **Conversational interface** - "How much did I spend on coffee?"
- **Streaming responses** - Real-time analysis with progress feedback
- **Intelligent insights** - AI-generated spending pattern analysis
- **Context-aware recommendations** - Personalized financial advice
- **Multi-function analysis** - Comprehensive data aggregation

### **Foundation-First Architecture**
- **Comprehensive validation** - All critical services monitored
- **Production-ready quality** - Zero build errors, TypeScript strict mode
- **Performance optimization** - Caching, deduplication, streaming
- **Error recovery** - Graceful failure management
- **Continuous monitoring** - Health checks and alerting

### **Analytics & Insights**
- **AI-driven spending analytics** with interactive charts
- **Intelligent category breakdown** and trend analysis
- **Merchant insights** and spending patterns
- **Export capabilities** for accounting and tax purposes
- **Real-time updates** with optimized performance

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js 18+** (ARM64 recommended for Apple Silicon)
- **npm** or **yarn**
- **Supabase** account
- **OpenAI API** key
- **Google Cloud Vision** credentials

### **Local Development Setup**

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

# Google Cloud Vision Configuration
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_gcv_credentials

# Application URL (Required for email confirmation in production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

4. **Database setup**:
```bash
npx prisma generate
npx prisma db push
```

5. **Foundation validation**:
```bash
npm run validate:foundation:local
```

6. **Start development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 **Testing & Quality Assurance**

### **Foundation Validation**
- **Comprehensive health checks** - Database, Storage, OCR, AI services
- **Production monitoring** - Real-time validation of critical services
- **Automated testing** - Foundation validation scripts for CI/CD
- **Error recovery** - Graceful failure management and rollback procedures

### **Test Coverage**
- **79 tests** with 95%+ pass rate
- **Component testing** with React Testing Library
- **API route testing** with realistic scenarios
- **Business logic validation** with comprehensive edge cases

### **CI/CD Pipeline**
- **Automated testing** on every commit
- **Type checking** and linting enforcement
- **Build verification** and deployment validation
- **Foundation validation** for production readiness

### **Quality Standards**
- **TypeScript strict mode** enforcement
- **ESLint** and **Prettier** for code consistency
- **Accessibility** compliance (WCAG 2.1)
- **Performance optimization** with Lighthouse scores

## 📁 **Project Structure**

```
steward/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes and server actions
│   │   │   ├── agent/         # AI agent endpoints
│   │   │   ├── receipts/      # Receipt management
│   │   │   ├── health/        # Foundation validation
│   │   │   └── test-*/        # Validation endpoints
│   │   ├── auth/              # Authentication flows
│   │   ├── profile/           # User profile management
│   │   └── receipts/          # Receipt management pages
│   ├── components/            # React components
│   │   ├── agent/             # AI chat interface
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard and stats
│   │   ├── receipts/          # Receipt management
│   │   └── ui/                # Reusable UI components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and services
│   │   └── services/          # External service integrations
│   │       ├── financeAgent.ts # Enhanced AI agent
│   │       ├── financeFunctions.ts # Financial analysis functions
│   │       └── cache.ts       # Intelligent caching system
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── scripts/                   # Foundation validation scripts
├── public/                    # Static assets
└── docs/                      # Project documentation
```

## 🎯 **AI-First Features**

### **Intelligent Receipt Processing**
- **AI-powered OCR** - Google Cloud Vision for precise text extraction
- **Smart categorization** - Merchant-based intelligent matching
- **Batch re-categorization** - One-click processing of existing receipts
- **Confidence scoring** - AI-powered accuracy assessment

### **Enhanced AI Agent**
- **Conversational interface** - Natural language queries
- **Streaming responses** - Real-time analysis with progress feedback
- **Intelligent caching** - 10-minute TTL with user-specific invalidation
- **Request deduplication** - Prevents duplicate processing
- **Function integration** - Direct access to financial analysis

### **Foundation Validation**
- **Comprehensive health checks** - All critical services monitored
- **Production monitoring** - Real-time validation and alerting
- **Automated testing** - Foundation validation scripts
- **Error recovery** - Graceful failure management

## 🔒 **Security & Privacy**

- **Row-level security** with Supabase RLS policies
- **JWT-based authentication** with secure session management
- **Input validation** and sanitization at multiple layers
- **GDPR compliance** with data export and deletion capabilities
- **Encrypted storage** for sensitive financial data

## 🚀 **Deployment**

The application is deployed using:
- **Vercel** for global CDN and edge functions
- **GitHub Actions** for automated CI/CD
- **Supabase** for production database and authentication
- **Foundation validation** for production monitoring

## 👨‍💻 **Development**

### **Built by Ruben Rivas**

This project was developed as a showcase of **AI-First architecture** capabilities, built entirely by a self-taught developer using prompt-driven development via Cursor.

**Development Approach**:
- **AI-First architecture** with foundation validation
- **Foundation-First approach** - Validate infrastructure before AI optimization
- **Balanced implementation** - Enhanced existing codebase without over-engineering
- **Production-ready quality** - All code passes CI/CD and deploys successfully
- **Continuous monitoring** - Health checks and validation at every stage

### **Contributing**

While this is primarily a showcase project, contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 **Links**

- **Live Application**: [https://hellosteward.org](https://hellosteward.org)
- **AI-First Architecture Plan**: [AI-First Architecture Documentation](docs/AI_FIRST_ARCHITECTURE_PLAN.md)
- **Foundation Validation**: [Foundation Validation Checklist](docs/FOUNDATION_VALIDATION_CHECKLIST.md)
- **Master System Guide**: [Master System Guide](docs/STEWARD_MASTER_SYSTEM_GUIDE.md)
- **CI/CD Setup**: [CI/CD Documentation](docs/CI_CD_SETUP.md)
- **Embedding Search Guide**: [Embedding Search Documentation](docs/EMBEDDING_SEARCH_GUIDE.md)

---

**Steward** - Empowering faithful financial stewardship through **AI-First architecture**. 💰✨

*Built with Foundation-First, AI-Optimized principles for maximum performance and reliability.*
