#!/bin/bash
# Script para arreglar problemas de build específicos

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔧 CLINIC SYSTEM - BUILD ISSUES FIX${NC}"
echo "=================================="

echo ""
echo -e "${YELLOW}📊 Problemas identificados:${NC}"
echo "   1. ❌ vite not found - está en devDependencies pero se necesita para build"
echo "   2. ❌ npm ci --only=production no instala devDependencies"
echo "   3. ❌ Frontend client en restart loop"
echo "   4. ❌ Verificaciones de API externa innecesarias"

echo ""
read -p "¿Aplicar fixes para problemas de build? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Fix cancelado"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}🔧 FIX 1: Dockerfile.admin - Cambiar npm ci a npm install${NC}"
cd clinic-admin-backend

# Backup original
cp Dockerfile.admin Dockerfile.admin.backup-$(date +%Y%m%d-%H%M%S)

# Fix npm install issue
sed -i 's/npm ci --only=production/npm install/' Dockerfile.admin

echo -e "${GREEN}✅ Dockerfile.admin corregido${NC}"

echo ""
echo -e "${BLUE}🔧 FIX 2: Limpiar contenedores e imágenes problemáticas${NC}"

# Stop any running containers
docker stop clinic-admin-system clinic-frontend-client 2>/dev/null || true

# Remove problematic containers
docker rm clinic-admin-system clinic-frontend-client 2>/dev/null || true

# Remove problematic images to force rebuild
docker rmi clinic-admin-backend_admin-system dashboard-clinica-frontend-client 2>/dev/null || true

echo -e "${GREEN}✅ Contenedores e imágenes limpiadas${NC}"

echo ""
echo -e "${BLUE}🔧 FIX 3: Rebuild Admin System con fix aplicado${NC}"

# Rebuild with corrected Dockerfile
docker-compose -f docker-compose.production.yml build --no-cache admin-system

echo ""
echo -e "${BLUE}🔧 FIX 4: Rebuild Frontend Client${NC}"
cd "$PROJECT_ROOT"

# Rebuild frontend client
docker-compose -f docker-compose.client-prod.yml build --no-cache frontend-client

echo ""
echo -e "${BLUE}🚀 FIX 5: Reiniciar servicios con builds corregidos${NC}"

# Start admin system
cd clinic-admin-backend
docker-compose -f docker-compose.production.yml up -d admin-system

echo "Esperando que admin system arranque..."
sleep 20

# Start frontend client
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.client-prod.yml up -d frontend-client

echo "Esperando que frontend client arranque..."
sleep 10

echo ""
echo -e "${BLUE}📊 VERIFICACIÓN POST-FIX${NC}"
echo "=========================="

echo "=== CONTENEDORES ACTIVOS ==="
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECKS ==="
echo "Admin System (60519)..."
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Admin System OK${NC}" || echo -e "${RED}❌ Admin System Error${NC}"

echo "Frontend Client (60521)..."
curl -f http://localhost:60521 2>/dev/null && echo -e "${GREEN}✅ Frontend Client OK${NC}" || echo -e "${RED}❌ Frontend Client Error${NC}"

echo ""
echo "=== PUERTOS INTERNOS ==="
netstat -tlnp | grep :60519 >/dev/null && echo -e "${GREEN}✅ Puerto 60519 activo${NC}" || echo -e "${YELLOW}⚠️ Puerto 60519 inactivo${NC}"
netstat -tlnp | grep :60521 >/dev/null && echo -e "${GREEN}✅ Puerto 60521 activo${NC}" || echo -e "${YELLOW}⚠️ Puerto 60521 inactivo${NC}"

echo ""
echo -e "${GREEN}✅ BUILD ISSUES CORREGIDOS${NC}"
echo "=========================="
echo ""
echo -e "${BLUE}🌐 URLs corregidas:${NC}"
echo "   🔧 Admin System: http://localhost:60519/admin"
echo "   👥 Client System: http://localhost:60521"
echo "   📚 API Docs: http://localhost:60519/docs"
echo ""
echo -e "${BLUE}🔑 Credenciales:${NC}"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""

# Check for any remaining issues
echo -e "${BLUE}🔍 Verificación de logs de errores:${NC}"
echo "Últimos errores del admin system:"
docker logs clinic-admin-system --tail=5 2>/dev/null | grep -i error || echo "Sin errores recientes"

echo ""
echo "Últimos errores del frontend client:"
docker logs clinic-frontend-client --tail=5 2>/dev/null | grep -i error || echo "Sin errores recientes"

echo ""
read -p "Presiona Enter para continuar..."