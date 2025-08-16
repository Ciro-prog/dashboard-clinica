#!/bin/bash
# Script rápido para verificar estado de producción

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔍 CLINIC SYSTEM - PRODUCTION STATUS CHECK${NC}"
echo "=========================================="

echo ""
echo -e "${BLUE}📊 CONTENEDORES ACTIVOS:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}💚 HEALTH CHECKS LOCALES:${NC}"
echo "Backend Admin (60519)..."
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ OK${NC}" || echo -e "${RED}❌ Error${NC}"

echo "Frontend Client (60521)..."  
curl -f http://localhost:60521 2>/dev/null && echo -e "${GREEN}✅ OK${NC}" || echo -e "${RED}❌ Error${NC}"

echo ""
echo -e "${BLUE}🌐 CONECTIVIDAD EXTERNA:${NC}"
echo "API Docs (pampaservers.com:60519)..."
curl -f http://pampaservers.com:60519/docs 2>/dev/null && echo -e "${GREEN}✅ Accesible${NC}" || echo -e "${YELLOW}⚠️ No accesible desde aquí${NC}"

echo ""
echo -e "${BLUE}🗄️ BASE DE DATOS EXTERNA:${NC}"
echo "Verificando ping a 192.168.1.23..."
ping -c 1 192.168.1.23 >/dev/null && echo -e "${GREEN}✅ IP accesible${NC}" || echo -e "${RED}❌ IP no accesible${NC}"

echo ""
echo -e "${BLUE}📋 URLs IMPORTANTES:${NC}"
echo "   🔧 API: http://pampaservers.com:60519"
echo "   📚 Docs: http://pampaservers.com:60519/docs"  
echo "   🏥 Admin: http://pampaservers.com:60519/admin"
echo "   👥 Client: http://pampaservers.com:60521"
echo ""
echo -e "${BLUE}🔑 DB Command:${NC}"
echo "   docker exec -it mongodb mongosh -u root -p servermuenpampa2025A! --authenticationDatabase admin"
echo ""

read -p "Presiona Enter para continuar..."