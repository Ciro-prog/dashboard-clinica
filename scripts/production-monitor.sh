#!/bin/bash
# Script para monitorear el sistema en producción

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}📊 CLINIC SYSTEM - PRODUCTION MONITORING${NC}"
echo "========================================="

echo ""
echo -e "${BLUE}🐳 Container Status:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Size}}"

echo ""
echo -e "${BLUE}💾 Resource Usage:${NC}"

# Memory usage
echo "Memory usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker ps --filter "name=clinic" --format "{{.Names}}")

echo ""
echo -e "${BLUE}🌐 Service Health Checks:${NC}"

# Admin system health
echo -n "Admin System (60519): "
if curl -s -f http://localhost:60519/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
    health_response=$(curl -s http://localhost:60519/health)
    echo "  Response: $health_response"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

echo ""
echo -e "${BLUE}📋 Recent Logs (last 10 lines):${NC}"

echo ""
echo "=== ADMIN SYSTEM ==="
docker logs clinic-admin-system --tail=10 2>/dev/null || echo "No logs available"

echo ""
echo -e "${BLUE}🔍 Service Connectivity:${NC}"

# Test external service connectivity
echo -n "MongoDB (192.168.1.23:60516): "
if nc -z 192.168.1.23 60516 2>/dev/null; then
    echo -e "${GREEN}✅ Reachable${NC}"
else
    echo -e "${RED}❌ Unreachable${NC}"
fi

echo -n "WAHA (pampaservers.com:60513): "
if curl -s -f http://pampaservers.com:60513 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Reachable${NC}"
else
    echo -e "${YELLOW}⚠️ Check required${NC}"
fi

echo ""
echo -e "${BLUE}📈 System Resources:${NC}"

# Server resources
echo "Disk usage:"
df -h / | tail -1 | awk '{print "  Root: " $5 " used, " $4 " available"}'

echo "Memory usage:"
free -h | grep "Mem:" | awk '{print "  RAM: " $3 "/" $2 " (" int($3/$2*100) "% used)"}'

echo "Load average:"
uptime | awk -F'load average:' '{print "  " $2}'

echo ""
echo -e "${BLUE}🕐 Uptime Information:${NC}"
echo "Server uptime: $(uptime -p)"

# Container uptime
admin_uptime=$(docker inspect clinic-admin-system --format '{{.State.StartedAt}}' 2>/dev/null)
if [ -n "$admin_uptime" ]; then
    echo "Admin container started: $admin_uptime"
fi

echo ""
echo -e "${GREEN}✅ Monitoring completed!${NC}"

read -p "Press Enter to continue..."