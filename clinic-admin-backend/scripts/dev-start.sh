#!/bin/bash
# ===========================================
# Script de Inicio para Modo Desarrollo
# Frontend con Hot Reload + Backend API
# ===========================================

set -e

echo "🚀 CLINIC DASHBOARD - MODO DESARROLLO"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar dependencias
command -v docker-compose >/dev/null 2>&1 || { 
    echo -e "${RED}❌ docker-compose no está instalado${NC}" >&2; 
    exit 1; 
}

command -v npm >/dev/null 2>&1 || { 
    echo -e "${RED}❌ npm no está instalado${NC}" >&2; 
    exit 1; 
}

# Limpiar contenedores previos
echo -e "${YELLOW}🧹 Limpiando contenedores previos...${NC}"
docker-compose -f ../docker-compose.unified.yml --profile development down 2>/dev/null || true

# Verificar si existe package.json en directorio correcto
if [ ! -f "../package.json" ]; then
    echo -e "${RED}❌ package.json no encontrado en directorio raíz${NC}"
    echo "Asegúrate de ejecutar desde el directorio correcto"
    exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "../node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias de Node.js...${NC}"
    cd .. && npm install && cd clinic-admin-backend/scripts
fi

# Iniciar servicios en modo desarrollo
echo -e "${GREEN}🎯 Iniciando servicios en modo DESARROLLO...${NC}"
echo ""
echo "Servicios que se iniciarán:"
echo -e "  ${BLUE}• Backend API:${NC} http://localhost:60519 (FastAPI + MongoDB)"
echo -e "  ${BLUE}• Frontend Dev:${NC} http://localhost:3000 (React + Hot Reload)"
echo ""
echo -e "${YELLOW}📝 NOTA: Los cambios en el frontend se aplicarán automáticamente${NC}"
echo ""

# Iniciar en background
docker-compose -f ../docker-compose.unified.yml --profile development up -d

# Mostrar logs iniciales
echo -e "${GREEN}✅ Servicios iniciados correctamente${NC}"
echo ""
echo -e "${BLUE}📊 Estado de los servicios:${NC}"
docker-compose -f ../docker-compose.unified.yml --profile development ps

echo ""
echo -e "${GREEN}🎉 DESARROLLO LISTO${NC}"
echo "======================================"
echo -e "🌐 Frontend: ${BLUE}http://localhost:3000${NC} (Hot Reload)"
echo -e "🔧 Backend:  ${BLUE}http://localhost:60519${NC}"
echo -e "📚 API Docs: ${BLUE}http://localhost:60519/docs${NC}"
echo "======================================"
echo ""
echo -e "${YELLOW}Para ver logs en tiempo real:${NC}"
echo "docker-compose -f docker-compose.unified.yml --profile development logs -f"
echo ""
echo -e "${YELLOW}Para detener los servicios:${NC}"
echo "./dev-stop.sh"