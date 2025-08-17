#!/bin/bash
# Script para corregir credenciales de MongoDB y configuración de frontend

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔧 CLINIC SYSTEM - DATABASE CREDENTIALS FIX${NC}"
echo "=============================================="

echo ""
echo -e "${YELLOW}🔍 Problemas identificados:${NC}"
echo "   1. ❌ MongoDB URL incorrecta - usando credenciales equivocadas"
echo "   2. ❌ Base de datos incorrecta: clinic_admin → clinica-dashboard"
echo "   3. ❌ Usuario incorrecto: root → admin"
echo "   4. ❌ Password incorrecta: servermuenpampa2025A! → PampaServers2025"
echo "   5. ❌ Frontend nginx: host.docker.internal no existe en Linux"

echo ""
read -p "¿Aplicar fixes basados en configuración que funcionaba antes? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Fix cancelado"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}🔧 FIX 1: Corrigiendo configuración de MongoDB${NC}"
cd clinic-admin-backend

# Backup current files
cp .env.prod .env.prod.backup-$(date +%Y%m%d-%H%M%S)
cp docker-compose.production.yml docker-compose.production.yml.backup-$(date +%Y%m%d-%H%M%S)

# Fix .env.prod with correct credentials
echo "Corrigiendo .env.prod..."
cat > .env.prod << 'EOF'
# Configuración de Producción CORREGIDA
# Base de datos externa con credenciales correctas
MONGODB_URL=mongodb://admin:PampaServers2025@192.168.1.23:60516/clinica-dashboard?authSource=admin

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

echo -e "${GREEN}✅ .env.prod corregido${NC}"

# Fix docker-compose.production.yml
echo "Corrigiendo docker-compose.production.yml..."
cat > docker-compose.production.yml << 'EOF'
# Docker Compose para Producción CORREGIDO

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
      # Base de datos externa CORREGIDA
      MONGODB_URL: mongodb://admin:PampaServers2025@192.168.1.23:60516/clinica-dashboard?authSource=admin
      
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

echo -e "${GREEN}✅ docker-compose.production.yml corregido${NC}"

echo ""
echo -e "${BLUE}🔧 FIX 2: Corrigiendo configuración de Frontend Client${NC}"
cd "$PROJECT_ROOT"

# Fix frontend client nginx configuration
echo "Corrigiendo frontend client para Linux..."
cat > docker-compose.client-prod.yml << 'EOF'
# Docker Compose Cliente - Producción CORREGIDO

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
      - VITE_API_URL=http://localhost:60519
    networks:
      - clinic-network
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  clinic-network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Frontend client configurado para Linux${NC}"

echo ""
echo -e "${BLUE}🔧 FIX 3: Deteniendo contenedores problemáticos${NC}"

docker stop clinic-admin-system clinic-frontend-client 2>/dev/null || true
docker rm clinic-admin-system clinic-frontend-client 2>/dev/null || true

echo -e "${GREEN}✅ Contenedores problemáticos detenidos${NC}"

echo ""
echo -e "${BLUE}🔧 FIX 4: Reconstruyendo con configuración corregida${NC}"

# Rebuild admin system
echo "Reconstruyendo admin system..."
cd clinic-admin-backend
docker-compose -f docker-compose.production.yml up -d --force-recreate

echo "Esperando que admin system arranque con credenciales correctas..."
sleep 20

# Rebuild frontend client
echo "Reconstruyendo frontend client..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.client-prod.yml up -d --force-recreate

echo "Esperando que frontend client arranque..."
sleep 15

echo ""
echo -e "${BLUE}📊 VERIFICACIÓN POST-FIX${NC}"
echo "=========================="

echo "=== CONTENEDORES ACTIVOS ==="
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECKS CON CREDENCIALES CORREGIDAS ==="
echo "Admin System (60519)..."
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Admin System OK${NC}" || echo -e "${RED}❌ Admin System Error${NC}"

echo "Frontend Client (60521)..."
curl -f http://localhost:60521 2>/dev/null && echo -e "${GREEN}✅ Frontend Client OK${NC}" || echo -e "${RED}❌ Frontend Client Error${NC}"

echo ""
echo "=== VERIFICACIÓN DE LOGS (últimas 5 líneas) ==="
echo "Admin System:"
docker logs clinic-admin-system --tail=5 2>/dev/null || echo "No disponible"

echo ""
echo "Frontend Client:"
docker logs clinic-frontend-client --tail=5 2>/dev/null || echo "No disponible"

echo ""
echo -e "${GREEN}✅ CREDENCIALES Y CONFIGURACIÓN CORREGIDAS${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}🔧 Configuración MongoDB corregida:${NC}"
echo "   Usuario: admin (antes root)"
echo "   Password: PampaServers2025 (antes servermuenpampa2025A!)"
echo "   Database: clinica-dashboard (antes clinic_admin)"
echo "   Host: 192.168.1.23:60516 (correcto)"
echo ""
echo -e "${BLUE}🌐 URLs corregidas:${NC}"
echo "   🔧 Admin System: http://localhost:60519/admin"
echo "   👥 Client System: http://localhost:60521"
echo "   📚 API Docs: http://localhost:60519/docs"
echo ""

read -p "Presiona Enter para continuar..."