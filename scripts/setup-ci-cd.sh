#!/bin/bash

# ============================================================================
# STEWARD CI/CD SETUP SCRIPT
# ============================================================================
# This script helps set up the CI/CD pipeline for Steward
# Run this script after creating the GitHub repository and Vercel project

set -e

echo "🚀 Setting up CI/CD pipeline for Steward..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the Steward project root directory"
    exit 1
fi

# Check if GitHub Actions workflow exists
if [ ! -f ".github/workflows/ci-cd.yml" ]; then
    print_error "CI/CD workflow file not found. Please ensure .github/workflows/ci-cd.yml exists"
    exit 1
fi

print_status "Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js version: $(node --version)"

# Check if git repository exists
if [ ! -d ".git" ]; then
    print_error "This is not a git repository. Please initialize git first."
    exit 1
fi
print_success "Git repository found"

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No remote origin found. Please add your GitHub repository as origin:"
    echo "  git remote add origin https://github.com/yourusername/steward.git"
    exit 1
fi
print_success "GitHub remote found"

# Check if npm scripts exist
if ! npm run | grep -q "test"; then
    print_error "Test script not found in package.json"
    exit 1
fi
print_success "Required npm scripts found"

print_status "Running local tests to ensure everything works..."

# Run tests locally
if npm test > /dev/null 2>&1; then
    print_success "Local tests passed"
else
    print_error "Local tests failed. Please fix test issues before setting up CI/CD"
    exit 1
fi

# Check build process
if npm run build > /dev/null 2>&1; then
    print_success "Build process works"
else
    print_error "Build process failed. Please fix build issues before setting up CI/CD"
    exit 1
fi

print_status "Setting up CI/CD configuration..."

# Create .gitignore entries if they don't exist
if [ ! -f ".gitignore" ]; then
    print_warning "No .gitignore file found. Creating one..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
EOF
    print_success "Created .gitignore file"
fi

print_status "CI/CD setup complete! Next steps:"

echo ""
echo -e "${GREEN}✅ Local setup complete${NC}"
echo ""
echo -e "${YELLOW}📋 Manual steps required:${NC}"
echo ""
echo "1. ${BLUE}Vercel Setup:${NC}"
echo "   - Go to https://vercel.com"
echo "   - Import your Steward repository"
echo "   - Configure build settings (Next.js preset)"
echo "   - Get your Vercel token and project IDs"
echo ""
echo "2. ${BLUE}GitHub Secrets:${NC}"
echo "   - Go to your GitHub repository → Settings → Secrets and variables → Actions"
echo "   - Add these secrets:"
echo "     - VERCEL_TOKEN"
echo "     - VERCEL_ORG_ID"
echo "     - VERCEL_PROJECT_ID"
echo ""
echo "3. ${BLUE}Environment Variables:${NC}"
echo "   - In Vercel Dashboard, add your production environment variables:"
echo "     - GOOGLE_CLOUD_PROJECT"
echo "     - GOOGLE_APPLICATION_CREDENTIALS"
echo "     - OPENAI_API_KEY"
echo "     - SUPABASE_URL"
echo "     - SUPABASE_ANON_KEY"
echo "     - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "4. ${BLUE}Test the Pipeline:${NC}"
echo "   - Push your changes: git push origin main"
echo "   - Check GitHub Actions tab for workflow execution"
echo "   - Verify deployment in Vercel Dashboard"
echo ""
echo -e "${GREEN}📚 For detailed instructions, see: docs/CI_CD_SETUP.md${NC}"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}" 