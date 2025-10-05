#!/bin/bash

# Cloudflare Workers Development Setup
# This script sets up the real Cloudflare backend integration

echo "🚀 Setting up CyberThreat AI with Cloudflare Workers AI"
echo "======================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed. Installing...${NC}"
    npm install -g wrangler
fi

echo -e "${BLUE}📦 Wrangler version:${NC} $(wrangler --version)"

# Check authentication
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare. Please log in:${NC}"
    echo "1. Run: wrangler login"
    echo "2. Follow the browser authentication"
    echo "3. Then run this script again"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"

# Create KV namespace
echo -e "${BLUE}🗄️  Creating KV namespace...${NC}"
KV_OUTPUT=$(wrangler kv:namespace create "THREAT_CACHE" 2>&1)
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

if [ ! -z "$KV_ID" ]; then
    echo -e "${GREEN}✅ KV namespace created: $KV_ID${NC}"
    # Update wrangler.toml with the actual KV ID
    sed -i '' "s/id = \"\"/id = \"$KV_ID\"/" wrangler.toml
    sed -i '' "s/preview_id = \"\"/preview_id = \"$KV_ID\"/" wrangler.toml
else
    echo -e "${YELLOW}⚠️  KV namespace may already exist${NC}"
fi

# Create R2 bucket
echo -e "${BLUE}🪣 Creating R2 bucket...${NC}"
wrangler r2 bucket create threat-intelligence-storage || echo -e "${YELLOW}⚠️  R2 bucket may already exist${NC}"

# Deploy the worker
echo -e "${BLUE}🚀 Deploying Cloudflare Worker...${NC}"
wrangler deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Worker deployed successfully!${NC}"
    
    # Get the worker URL
    WORKER_URL=$(wrangler whoami --format json | jq -r '.account.name')
    echo -e "${BLUE}🌐 Worker URL: https://${WORKER_URL}.workers.dev${NC}"
    
    # Start local development server for frontend
    echo -e "${BLUE}🌐 Starting frontend server...${NC}"
    echo -e "${GREEN}✅ CyberThreat AI is now running with real Cloudflare Workers AI!${NC}"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🤖 Backend: https://${WORKER_URL}.workers.dev"
    echo ""
    echo "🎯 Features now available:"
    echo "   • Real Llama 3.3 AI analysis"
    echo "   • Cloudflare Workers AI integration"
    echo "   • Durable Objects for state management"
    echo "   • Real-time threat processing"
    echo "   • Production-ready infrastructure"
    echo ""
    echo "Press Ctrl+C to stop the frontend server"
    
    # Start frontend server
    node dev-server.js
    
else
    echo -e "${RED}❌ Worker deployment failed${NC}"
    echo "This might be due to macOS compatibility issues."
    echo "Try running: wrangler dev --remote"
    exit 1
fi
