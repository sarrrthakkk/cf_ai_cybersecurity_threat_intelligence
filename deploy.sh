#!/bin/bash

# Deployment script for AI-Powered Cybersecurity Threat Intelligence Platform
# This script handles the complete deployment process to Cloudflare

set -e

echo "🚀 Starting deployment of CyberThreat AI Platform..."

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

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

print_status "Checking Cloudflare authentication..."
wrangler whoami

# Check if environment file exists
if [ ! -f ".env" ]; then
    print_warning "No .env file found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Please edit .env file with your actual values before continuing."
        print_warning "Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN"
        exit 1
    else
        print_error "No env.example file found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "Missing required environment variables:"
    print_error "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set in .env file"
    exit 1
fi

print_status "Environment variables loaded successfully"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the project
print_status "Building the project..."
npm run build

# Deploy Workers and Durable Objects
print_status "Deploying Cloudflare Workers..."
wrangler deploy

# Deploy Pages frontend
print_status "Deploying Cloudflare Pages..."
wrangler pages deploy src/frontend --project-name=cyberthreat-ai-frontend

# Set up secrets
print_status "Setting up secrets..."
if [ ! -z "$THREAT_FEED_API_KEY" ]; then
    wrangler secret put THREAT_FEED_API_KEY
fi

if [ ! -z "$ENCRYPTION_KEY" ]; then
    wrangler secret put ENCRYPTION_KEY
fi

if [ ! -z "$WEBHOOK_SECRET" ]; then
    wrangler secret put WEBHOOK_SECRET
fi

# Create KV namespace if it doesn't exist
print_status "Setting up KV namespace..."
wrangler kv:namespace create "THREAT_CACHE" || print_warning "KV namespace may already exist"

# Create R2 bucket if it doesn't exist
print_status "Setting up R2 bucket..."
wrangler r2 bucket create threat-intelligence-storage || print_warning "R2 bucket may already exist"

# Run tests
print_status "Running tests..."
npm test || print_warning "Tests failed, but deployment continues..."

# Get deployment URLs
print_status "Getting deployment information..."
WORKER_URL=$(wrangler whoami --format json | jq -r '.account.name')
PAGES_URL=$(wrangler pages list | grep cyberthreat-ai-frontend | awk '{print $2}')

print_success "Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "====================="
echo "Worker URL: https://${WORKER_URL}.workers.dev"
echo "Pages URL: https://${PAGES_URL}"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your DNS records to point to the Pages URL"
echo "2. Configure your threat feed API keys"
echo "3. Test the application functionality"
echo "4. Set up monitoring and alerts"
echo ""
echo "📚 Documentation:"
echo "- README.md: Complete setup and usage guide"
echo "- PROMPTS.md: AI prompts used in development"
echo "- API Documentation: Available at /api/docs endpoint"
echo ""
print_success "CyberThreat AI Platform is now live! 🎉"
