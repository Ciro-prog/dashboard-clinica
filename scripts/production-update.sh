#!/bin/bash
# Script para actualizar el sistema en producción desde Git

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔄 CLINIC SYSTEM - PRODUCTION UPDATE${NC}"
echo "==================================="

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}📋 Current status:${NC}"
echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git log -1 --oneline)"

echo ""
echo -e "${BLUE}📥 Pulling latest changes:${NC}"

# Pull latest changes
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

echo "New commit: $(git log -1 --oneline)"

echo ""
echo -e "${BLUE}🔧 Updating services:${NC}"

cd clinic-admin-backend

# Create backup of current containers
echo "Creating backup of current state..."
docker-compose -f docker-compose.production.yml logs > logs-backup-$(date +%Y%m%d-%H%M%S).log

# Rebuild and restart services
echo "Rebuilding services with latest code..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build --force-recreate

# Wait for services to stabilize
echo "Waiting for services to restart..."
sleep 25

echo ""
echo -e "${BLUE}🧪 Verifying update:${NC}"

# Check container status
echo "Container status:"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Health verification:"
curl -s -f http://localhost:60519/health >/dev/null && echo -e "${GREEN}✅ Admin System: OK${NC}" || echo -e "${RED}❌ Admin System: Error${NC}"

# Show recent logs
echo ""
echo "Recent logs (last 5 lines):"
docker logs clinic-admin-system --tail=5

echo ""
echo -e "${GREEN}✅ Update completed!${NC}"
echo ""
echo -e "${BLUE}🌐 Verify services at:${NC}"
echo "🔧 Admin: http://pampaservers.com:60519/admin"
echo "📚 Docs: http://pampaservers.com:60519/docs"

read -p "Press Enter to continue..."