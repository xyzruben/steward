#!/bin/bash

# 🚀 PHASE COMPLETION COMMIT SCRIPT
# Automates the commit and push process for each phase of the Systemic Foundation-First Methodology

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🎯 $1${NC}"
}

# Check if phase number is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <phase_number> [phase_name]"
    echo "Example: $0 0 'Systematic Problem Decomposition'"
    exit 1
fi

PHASE_NUMBER=$1
PHASE_NAME=${2:-"Phase $PHASE_NUMBER"}

print_header "PHASE $PHASE_NUMBER COMPLETION COMMIT"
echo "============================================================"

# Check git status
print_status "Checking git status..."
if ! git status --porcelain | grep -q .; then
    print_warning "No changes to commit. Are you sure Phase $PHASE_NUMBER is complete?"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Commit cancelled."
        exit 1
    fi
fi

# Add all changes
print_status "Adding all changes..."
git add .

# Create commit message
COMMIT_MESSAGE="🎉 PHASE $PHASE_NUMBER COMPLETE: $PHASE_NAME

✅ PHASE $PHASE_NUMBER: $PHASE_NAME - COMPLETE

This commit represents the completion of Phase $PHASE_NUMBER of the 
Systemic Foundation-First Methodology.

METHODOLOGY: Systemic Foundation-First Methodology
PHASE: $PHASE_NUMBER - $PHASE_NAME
STATUS: ✅ COMPLETE
DATE: $(date '+%B %d, %Y')

For detailed documentation, see:
- docs/PHASE_${PHASE_NUMBER}_COMPLETION_SUMMARY.md
- docs/PHASE_${PHASE_NUMBER}_PROBLEM_DECOMPOSITION.md (if applicable)

READY FOR PHASE $((PHASE_NUMBER + 1))"

# Commit changes
print_status "Creating commit..."
git commit -m "$COMMIT_MESSAGE"

# Push to remote
print_status "Pushing to GitHub..."
git push origin main

print_status "PHASE $PHASE_NUMBER SUCCESSFULLY COMMITTED AND PUSHED! 🚀"
echo ""
print_header "PHASE $PHASE_NUMBER COMPLETION SUMMARY"
echo "============================================================"
echo "✅ Phase $PHASE_NUMBER: $PHASE_NAME - COMPLETE"
echo "📝 Commit: $(git rev-parse --short HEAD)"
echo "🌐 Pushed to: origin/main"
echo "📅 Date: $(date '+%B %d, %Y at %I:%M %p')"
echo ""
echo "🎯 Ready to proceed to Phase $((PHASE_NUMBER + 1))"
echo ""
print_status "Methodology progress tracking: SUCCESS ✨" 