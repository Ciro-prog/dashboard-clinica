#!/bin/bash
# Script para deploy completo en servidor Linux de producción

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🚀 CLINIC SYSTEM - PRODUCTION DEPLOYMENT${NC}"
echo "========================================"

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}📊 Pre-deployment checks:${NC}"

# Check Git status
if [ -d ".git" ]; then
    echo "Git status:"
    git status --porcelain
    echo "Current branch: $(git branch --show-current)"
    echo "Latest commit: $(git log -1 --oneline)"
else
    echo "⚠️ Not a git repository"
fi

echo ""
echo -e "${BLUE}🔧 Docker environment check:${NC}"
docker --version || { echo -e "${RED}❌ Docker not installed${NC}"; exit 1; }
docker-compose --version || { echo -e "${RED}❌ Docker Compose not installed${NC}"; exit 1; }

echo ""
echo -e "${BLUE}📦 Building and deploying services:${NC}"

cd clinic-admin-backend

# Stop existing services
echo "Stopping existing services..."
docker-compose -f docker-compose.production.yml down

# Build and start admin system
echo "Building and starting admin system..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to start
echo "Waiting for services to initialize..."
sleep 30

echo ""
echo -e "${BLUE}🧪 Post-deployment verification:${NC}"

# Check container status
echo "Container status:"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Health checks:"

# Admin system health
admin_health=$(curl -s -f http://localhost:60519/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Admin System: Healthy${NC}"
    echo "Response: $admin_health"
else
    echo -e "${RED}❌ Admin System: Unhealthy${NC}"
    echo "Checking logs..."
    docker logs clinic-admin-system --tail=10
fi

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "🔧 Admin Dashboard: http://pampaservers.com:60519/admin"
echo "📚 API Documentation: http://pampaservers.com:60519/docs"
echo "⚡ Health Check: http://pampaservers.com:60519/health"

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo "Check the URLs above to verify everything is working correctly."

read -p "Press Enter to continue..."