#!/bin/bash

# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# Automated production deployment with validation and rollback capabilities
# See: Master System Guide - DevOps and Deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_section() {
    echo -e "\n${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

# Configuration
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="./deployment_${DEPLOYMENT_ID}.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log to file
log_to_file() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check environment
check_environment() {
    log_section "ENVIRONMENT VALIDATION"
    
    # Check required tools
    local required_tools=("node" "npm" "git" "vercel")
    for tool in "${required_tools[@]}"; do
        if ! command_exists "$tool"; then
            log_error "$tool is not installed"
            exit 1
        fi
        log_success "$tool is available"
    done
    
    # Check Node.js version
    local node_version=$(node --version)
    log "Node.js version: $node_version"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Function to create backup
create_backup() {
    log_section "CREATING BACKUP"
    
    local backup_file="$BACKUP_DIR/backup_${DEPLOYMENT_ID}.tar.gz"
    
    # Create backup of current state
    tar -czf "$backup_file" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='*.log' \
        .
    
    log_success "Backup created: $backup_file"
    log_to_file "Backup created: $backup_file"
}

# Function to run pre-deployment validation
run_validation() {
    log_section "PRE-DEPLOYMENT VALIDATION"
    
    # Run production validation script
    if ! npm run validate:production; then
        log_error "Production validation failed"
        exit 1
    fi
    
    log_success "Pre-deployment validation passed"
    log_to_file "Pre-deployment validation passed"
}

# Function to check git status
check_git_status() {
    log_section "GIT STATUS CHECK"
    
    # Check if working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "Working directory has uncommitted changes"
        git status --short
        
        read -p "Do you want to continue with uncommitted changes? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    else
        log_success "Working directory is clean"
    fi
    
    # Get current commit hash
    local commit_hash=$(git rev-parse HEAD)
    local commit_message=$(git log -1 --pretty=format:"%s")
    
    log "Current commit: $commit_hash"
    log "Commit message: $commit_message"
    log_to_file "Deploying commit: $commit_hash - $commit_message"
}

# Function to install dependencies
install_dependencies() {
    log_section "INSTALLING DEPENDENCIES"
    
    # Clean install
    log "Cleaning node_modules..."
    rm -rf node_modules package-lock.json
    
    log "Installing dependencies..."
    npm install
    
    log_success "Dependencies installed successfully"
    log_to_file "Dependencies installed successfully"
}

# Function to run database migrations
run_migrations() {
    log_section "DATABASE MIGRATIONS"
    
    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate
    
    # Check for pending migrations
    log "Checking for pending migrations..."
    local pending_migrations=$(npx prisma migrate status --json | jq -r '.migrations[] | select(.applied == false) | .migration_name')
    
    if [[ -n "$pending_migrations" ]]; then
        log_warning "Found pending migrations:"
        echo "$pending_migrations"
        
        read -p "Do you want to apply pending migrations? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Applying migrations..."
            npx prisma migrate deploy
            log_success "Migrations applied successfully"
            log_to_file "Migrations applied successfully"
        else
            log_warning "Skipping migrations"
            log_to_file "Migrations skipped"
        fi
    else
        log_success "No pending migrations"
        log_to_file "No pending migrations"
    fi
}

# Function to build application
build_application() {
    log_section "BUILDING APPLICATION"
    
    # Clean previous build
    log "Cleaning previous build..."
    rm -rf .next
    
    # Build application
    log "Building application..."
    npm run build
    
    log_success "Application built successfully"
    log_to_file "Application built successfully"
}

# Function to run tests
run_tests() {
    log_section "RUNNING TESTS"
    
    log "Running test suite..."
    if npm test; then
        log_success "All tests passed"
        log_to_file "All tests passed"
    else
        log_error "Tests failed"
        log_to_file "Tests failed"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_to_vercel() {
    log_section "DEPLOYING TO VERCEL"
    
    # Check if Vercel CLI is authenticated
    if ! vercel whoami >/dev/null 2>&1; then
        log_error "Vercel CLI not authenticated. Please run 'vercel login' first."
        exit 1
    fi
    
    # Deploy to production
    log "Deploying to production..."
    local deployment_url=$(vercel --prod --yes)
    
    if [[ $? -eq 0 ]]; then
        log_success "Deployment successful"
        log "Deployment URL: $deployment_url"
        log_to_file "Deployment successful: $deployment_url"
        
        # Store deployment URL for rollback
        echo "$deployment_url" > "$BACKUP_DIR/last_deployment_url.txt"
    else
        log_error "Deployment failed"
        log_to_file "Deployment failed"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log_section "VERIFYING DEPLOYMENT"
    
    # Get deployment URL
    local deployment_url=$(cat "$BACKUP_DIR/last_deployment_url.txt" 2>/dev/null || echo "")
    
    if [[ -z "$deployment_url" ]]; then
        log_warning "Could not determine deployment URL for verification"
        return
    fi
    
    log "Verifying deployment at: $deployment_url"
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    sleep 10
    
    # Check health endpoint
    local health_url="$deployment_url/api/health"
    log "Checking health endpoint: $health_url"
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            log_success "Health check passed"
            log_to_file "Health check passed"
            break
        else
            log "Health check attempt $attempt/$max_attempts failed, retrying..."
            sleep 5
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Health check failed after $max_attempts attempts"
        log_to_file "Health check failed"
        return 1
    fi
    
    # Test AI agent endpoint
    log "Testing AI agent endpoint..."
    local test_response=$(curl -s -X POST "$deployment_url/api/agent/query" \
        -H "Content-Type: application/json" \
        -d '{"query": "test"}' || echo "")
    
    if [[ -n "$test_response" ]]; then
        log_success "AI agent endpoint test passed"
        log_to_file "AI agent endpoint test passed"
    else
        log_warning "AI agent endpoint test failed (this might be expected without authentication)"
        log_to_file "AI agent endpoint test failed"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    log_section "ROLLBACK DEPLOYMENT"
    
    log_warning "Rolling back deployment..."
    
    # Get previous deployment
    local previous_deployment=$(vercel ls | grep -v "latest" | tail -n 1 | awk '{print $1}')
    
    if [[ -n "$previous_deployment" ]]; then
        log "Rolling back to: $previous_deployment"
        vercel rollback "$previous_deployment" --yes
        
        if [[ $? -eq 0 ]]; then
            log_success "Rollback successful"
            log_to_file "Rollback successful to $previous_deployment"
        else
            log_error "Rollback failed"
            log_to_file "Rollback failed"
        fi
    else
        log_error "No previous deployment found for rollback"
        log_to_file "No previous deployment found for rollback"
    fi
}

# Function to cleanup
cleanup() {
    log_section "CLEANUP"
    
    # Remove old backups (keep last 5)
    log "Cleaning up old backups..."
    ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    # Remove old log files (keep last 10)
    log "Cleaning up old log files..."
    ls -t deployment_*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Function to display deployment summary
display_summary() {
    log_section "DEPLOYMENT SUMMARY"
    
    local deployment_url=$(cat "$BACKUP_DIR/last_deployment_url.txt" 2>/dev/null || echo "Unknown")
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Deployment ID:${NC} $DEPLOYMENT_ID"
    echo -e "${BLUE}Deployment URL:${NC} $deployment_url"
    echo -e "${BLUE}Log File:${NC} $LOG_FILE"
    echo -e "${BLUE}Backup:${NC} $BACKUP_DIR/backup_${DEPLOYMENT_ID}.tar.gz"
    
    log_to_file "Deployment completed successfully"
}

# Main deployment function
main() {
    log_section "STARTING PRODUCTION DEPLOYMENT"
    log "Deployment ID: $DEPLOYMENT_ID"
    log_to_file "Starting deployment: $DEPLOYMENT_ID"
    
    # Trap to handle errors and cleanup
    trap 'log_error "Deployment failed. Check logs: $LOG_FILE"; cleanup; exit 1' ERR
    
    # Run deployment steps
    check_environment
    create_backup
    run_validation
    check_git_status
    install_dependencies
    run_migrations
    build_application
    run_tests
    deploy_to_vercel
    verify_deployment
    cleanup
    display_summary
    
    log_section "DEPLOYMENT COMPLETED SUCCESSFULLY"
    log_to_file "Deployment completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Production Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --rollback     Rollback to previous deployment"
        echo "  --verify       Verify current deployment"
        echo ""
        echo "Examples:"
        echo "  $0              # Full deployment"
        echo "  $0 --rollback   # Rollback deployment"
        echo "  $0 --verify     # Verify deployment"
        exit 0
        ;;
    --rollback)
        rollback_deployment
        exit 0
        ;;
    --verify)
        verify_deployment
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 