# Steward - AI-Powered Receipt & Expense Tracker

Steward is a production-grade, AI-powered receipt and expense tracker designed for individuals and professionals who value faithful financial stewardship. The application automates the tedious process of manual expense tracking by leveraging optical character recognition (OCR) and artificial intelligence to extract, categorize, and analyze receipt data.

## Features

- 📸 **Smart Receipt Upload**: Drag-and-drop receipt images with automatic data extraction
- 🤖 **AI-Powered OCR**: Uses Google Cloud Vision API for accurate text recognition
- 🏷️ **Intelligent Categorization**: OpenAI GPT-4 analyzes and categorizes expenses
- 📊 **Expense Analytics**: Track spending patterns and generate insights
- 🔒 **Secure Storage**: All data stored securely in Supabase with user authentication
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Supported File Formats

**✅ Supported:**
- JPEG (.jpg, .jpeg)
- PNG (.png)

**❌ Not Supported:**
- HEIC/HEIF files (iPhone default format)
- GIF, WebP, and other formats

**Note:** If you have HEIC files from your iPhone, please convert them to JPEG before uploading. You can:
1. Use your phone's camera app to save photos as JPEG
2. Use online converters like [Convertio](https://convertio.co/heic-jpg/) or [CloudConvert](https://cloudconvert.com/heic-to-jpg)
3. Use macOS Preview app to export HEIC files as JPEG

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth + Storage)
- **AI/OCR**: Google Cloud Vision API, OpenAI GPT-4
- **Database**: Prisma ORM with PostgreSQL
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud Vision API key
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steward
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Sign Up/Login**: Create an account or sign in with your existing credentials
2. **Upload Receipts**: Drag and drop receipt images or click to browse
3. **Review Data**: The AI will extract merchant, amount, date, and category
4. **Track Expenses**: View your spending patterns and analytics

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
├── components/          # React components organized by feature
├── lib/                 # Utility functions and service integrations
├── types/               # TypeScript type definitions
└── context/             # React context providers
```

### Key Components

- **ReceiptUpload**: Handles file upload with format validation
- **DashboardContent**: Main dashboard with stats and recent receipts
- **ReceiptStats**: Displays spending analytics
- **RecentReceipts**: Shows latest uploaded receipts

### API Routes

- `/api/receipts/upload`: Handles receipt upload and OCR processing
- `/api/receipts`: Retrieves user's receipts
- `/api/receipts/stats`: Provides spending statistics
- `/api/auth/sync-user`: Syncs user authentication state

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/your-repo/steward/issues) page
2. Create a new issue with detailed information about your problem
3. Include steps to reproduce, expected behavior, and actual behavior

## Roadmap

- [ ] Multi-currency support
- [ ] Integration with accounting software
- [ ] Recurring expense detection
- [ ] Advanced analytics dashboards
- [ ] Mobile app development
- [ ] Export capabilities for tax preparation
