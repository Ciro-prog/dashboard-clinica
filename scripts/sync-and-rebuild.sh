#!/bin/bash
# Script para sincronizar código del repositorio y rebuild completo
# Soluciona problemas de versión entre local y servidor

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔄 SYNC & REBUILD - Sistema Clínico${NC}"
echo "====================================="

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}📋 Estado actual:${NC}"
echo "Current commit: $(git log -1 --oneline)"
echo "Project directory: $(pwd)"

echo ""
echo -e "${BLUE}🔄 PASO 1: Sincronizando con repositorio remoto${NC}"
git fetch origin main
git reset --hard origin/main

echo ""
echo -e "${BLUE}📋 Estado después del sync:${NC}"
echo "New commit: $(git log -1 --oneline)"

echo ""
echo -e "${BLUE}🏗️ PASO 2: Rebuild completo del frontend${NC}"
echo "Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite

echo "Installing dependencies..."
npm install --silent

echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    
    # Copy to backend
    echo "Copying build to backend..."
    rm -rf clinic-admin-backend/static/admin/*
    mkdir -p clinic-admin-backend/static/admin
    cp -r dist/* clinic-admin-backend/static/admin/
    
    echo "Build copied to static/admin"
    echo "Files: $(find clinic-admin-backend/static/admin -type f | wc -l)"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    echo "Error details:"
    npm run build
    exit 1
fi

# Navigate back to backend
cd clinic-admin-backend

echo ""
echo -e "${BLUE}🐳 PASO 3: Rebuild del backend${NC}"
echo "Stopping containers..."
docker-compose down

echo "Building Docker image..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend rebuild successful${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Start services
echo ""
echo -e "${BLUE}🚀 PASO 4: Iniciando servicios${NC}"
docker-compose up -d

# Wait for startup
echo ""
echo -e "${BLUE}⏳ Esperando inicialización (20 segundos)...${NC}"
sleep 20

echo ""
echo -e "${BLUE}🧪 VERIFICACIÓN${NC}"
echo "=================="

echo ""
echo "📊 Estado del contenedor:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -5

echo ""
echo "🌐 Health Check:"
backend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/health 2>/dev/null || echo "ERROR")

if [ "$backend_response" = "200" ]; then
    echo -e "${GREEN}✅ Backend: OK${NC}"
else
    echo -e "${RED}❌ Backend: ERROR${NC}"
    echo "Checking logs for issues..."
    docker logs --tail 10 clinic-admin-system
fi

echo ""
echo "==============================="
echo -e "${GREEN}🎉 SYNC & REBUILD COMPLETADO${NC}"
echo "==============================="

echo ""
echo "🌐 URLs para probar:"
echo "   🔧 Admin Dashboard: http://localhost:60519/admin"
echo "   📚 API Docs: http://localhost:60519/docs"
echo "   ⚡ Health Check: http://localhost:60519/health"

echo ""
if [ "$backend_response" = "200" ]; then
    echo -e "${GREEN}¡Sincronización y rebuild completados exitosamente!${NC}"
else
    echo -e "${YELLOW}Sync completado con advertencias. Revisar logs si persisten problemas.${NC}"
fi