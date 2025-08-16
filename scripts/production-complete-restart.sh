#!/bin/bash
# Script para restart completo con configuraciones de producción actualizadas

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🔄 CLINIC SYSTEM - PRODUCTION COMPLETE RESTART${NC}"
echo "=============================================="

echo ""
echo -e "${YELLOW}⚠️ IMPORTANTE: Este script aplicará TODAS las mejoras de reestructuración${NC}"
echo "   - Detendrá servicios obsoletos"
echo "   - Aplicará configuraciones de producción"
echo "   - Conectará a DB externa: 192.168.1.23:60516"
echo "   - Configurará URLs de producción: pampaservers.com"
echo ""

read -p "¿Continuar con restart completo? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${RED}❌ Restart cancelado por el usuario${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 ESTADO ACTUAL:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${RED}🛑 PASO 1: Deteniendo TODOS los servicios clinic${NC}"
echo "================================================"

echo "Deteniendo clinic-frontend-client..."
docker stop clinic-frontend-client 2>/dev/null || echo "Ya detenido"

echo "Deteniendo clinic-backend-api..."
docker stop clinic-backend-api 2>/dev/null || echo "Ya detenido"

echo "Deteniendo clinic-admin-frontend..."
docker stop clinic-admin-frontend 2>/dev/null || echo "Ya detenido"

echo "Deteniendo clinic-admin-system..."
docker stop clinic-admin-system 2>/dev/null || echo "Ya detenido"

echo "Deteniendo clinic-admin-mongodb..."
docker stop clinic-admin-mongodb 2>/dev/null || echo "Ya detenido"

echo ""
echo -e "${YELLOW}🧹 PASO 2: Limpiando contenedores detenidos${NC}"
echo "============================================"
docker container prune -f

echo ""
echo -e "${BLUE}🔧 PASO 3: Verificando conectividad con DB de producción${NC}"
echo "======================================================="
echo "Verificando conexión a 192.168.1.23:60516..."
ping -c 1 192.168.1.23 >/dev/null && echo -e "${GREEN}✅ IP accesible${NC}" || echo -e "${RED}❌ IP no accesible${NC}"

echo ""
echo -e "${BLUE}📝 PASO 4: Configurando variables de producción${NC}"
echo "==============================================="

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Create production environment file
echo "Creando .env de producción..."
cd clinic-admin-backend

cat > .env.prod << 'EOF'
# Configuración de Producción
# Base de datos externa
MONGODB_URL=mongodb://root:servermuenpampa2025A!@192.168.1.23:60516/clinic_admin?authSource=admin

# Configuración de servidor
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET_KEY=clinic-production-jwt-key-2024-secure

# API Keys de producción
API_KEY_DEV=test123456
API_KEY_PROD=pampaserver2025enservermuA!

# URLs de producción
CORS_ORIGINS=["http://pampaservers.com:60519","http://pampaservers.com:60521","http://pampaservers.com:60523","http://localhost:60519","http://localhost:60521","http://localhost:60523"]
ALLOWED_ORIGINS=http://pampaservers.com:60519,http://pampaservers.com:60521,http://pampaservers.com:60523,http://localhost:60519,http://localhost:60521,http://localhost:60523

# Environment
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000
EOF

echo -e "${GREEN}✅ Configuración de producción creada${NC}"

echo ""
echo -e "${BLUE}🔧 PASO 5: Actualizando docker-compose para producción${NC}"
echo "======================================================"

# Create production docker-compose
echo "Creando docker-compose.production.yml..."

cat > docker-compose.production.yml << 'EOF'
# Docker Compose para Producción

services:
  # Admin Backend + Frontend
  admin-system:
    build:
      context: .
      dockerfile: Dockerfile.admin
    container_name: clinic-admin-system
    restart: unless-stopped
    ports:
      - "60519:8000"
    environment:
      # Base de datos externa
      MONGODB_URL: mongodb://root:servermuenpampa2025A!@192.168.1.23:60516/clinic_admin?authSource=admin
      
      # Admin Configuration
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: admin123
      JWT_SECRET_KEY: clinic-production-jwt-key-2024-secure
      
      # API Configuration
      API_KEY_DEV: test123456
      API_KEY_PROD: pampaserver2025enservermuA!
      
      # CORS
      ALLOWED_ORIGINS: "http://pampaservers.com:60519,http://pampaservers.com:60521,http://pampaservers.com:60523,http://localhost:60519,http://localhost:60521,http://localhost:60523"
      
      # Environment
      ENVIRONMENT: production
      DEBUG: false
      HOST: 0.0.0.0
      PORT: 8000
      
    volumes:
      - admin_uploads:/app/uploads
    networks:
      - admin-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  admin_uploads:
    driver: local

networks:
  admin-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ docker-compose.production.yml creado${NC}"

echo ""
echo -e "${GREEN}🚀 PASO 6: Iniciando Admin System con configuración de producción${NC}"
echo "=================================================================="
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Esperando que el sistema esté listo..."
sleep 15

echo ""
echo -e "${GREEN}🚀 PASO 7: Iniciando Frontend Client con configuración de producción${NC}"
echo "====================================================================="
cd "$PROJECT_ROOT"

# Create client production docker-compose
echo "Actualizando configuración de frontend client..."

cat > docker-compose.client-prod.yml << 'EOF'
# Docker Compose Cliente - Producción

services:
  frontend-client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: clinic-frontend-client
    ports:
      - "60521:80"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://pampaservers.com:60519
    networks:
      - clinic-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  clinic-network:
    driver: bridge
EOF

docker-compose -f docker-compose.client-prod.yml up -d

echo ""
echo "⏳ Esperando que frontend client esté listo..."
sleep 10

echo ""
echo -e "${BLUE}📊 PASO 8: Verificando estado final${NC}"
echo "==================================="

echo "=== CONTENEDORES ACTIVOS ==="
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECKS ==="
echo "Verificando Admin System (60519)..."
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Admin System OK${NC}" || echo -e "${RED}❌ Admin System Error${NC}"

echo "Verificando Frontend Client (60521)..."
curl -f http://localhost:60521 2>/dev/null && echo -e "${GREEN}✅ Frontend Client OK${NC}" || echo -e "${RED}❌ Frontend Client Error${NC}"

echo ""
echo "=== CONECTIVIDAD DE PRODUCCIÓN ==="
echo "Verificando API externa..."
curl -f http://pampaservers.com:60519/docs 2>/dev/null && echo -e "${GREEN}✅ API Externa OK${NC}" || echo -e "${YELLOW}⚠️ API Externa no accesible desde aquí${NC}"

echo ""
echo -e "${GREEN}✅ RESTART COMPLETO FINALIZADO${NC}"
echo "=============================="
echo ""
echo -e "${BLUE}🌐 URLs DE PRODUCCIÓN:${NC}"
echo "   🔧 API Backend:       http://pampaservers.com:60519"
echo "   📚 API Docs:          http://pampaservers.com:60519/docs"
echo "   🏥 Admin Dashboard:   http://pampaservers.com:60519/admin"
echo "   👥 Client Dashboard:  http://pampaservers.com:60521"
echo ""
echo -e "${BLUE}🔐 Credenciales Admin:${NC}"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo -e "${BLUE}📋 Para acceder al ApiDocumentationModal:${NC}"
echo "   1. Ir a http://pampaservers.com:60519/admin"
echo "   2. Login con credenciales admin"
echo "   3. Tab 'Clínicas' → Botón 'Documentación'"
echo ""
echo -e "${BLUE}🗄️ Base de datos:${NC}"
echo "   Host: 192.168.1.23:60516"
echo "   Usuario: root"
echo "   Password: servermuenpampa2025A!"
echo "   Comando: docker exec -it mongodb mongosh -u root -p servermuenpampa2025A! --authenticationDatabase admin"
echo ""
echo -e "${BLUE}📁 Archivos creados:${NC}"
echo "   - clinic-admin-backend/.env.prod"
echo "   - clinic-admin-backend/docker-compose.production.yml"
echo "   - docker-compose.client-prod.yml"
echo ""
echo -e "${GREEN}🎉 TODOS LOS CAMBIOS DE REESTRUCTURACIÓN APLICADOS${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Sistema completamente actualizado con:${NC}"
echo "   - Conexión a DB externa de producción"
echo "   - URLs de producción configuradas"
echo "   - API Keys de producción"
echo "   - CORS actualizado"
echo "   - Todas las mejoras implementadas"
echo ""

read -p "Presiona Enter para continuar..."