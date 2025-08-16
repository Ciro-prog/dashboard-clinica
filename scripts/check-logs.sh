#!/bin/bash
# Script para verificar logs de errores de los contenedores

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 CLINIC SYSTEM - LOG CHECKER${NC}"
echo "==============================="

echo ""
echo -e "${BLUE}📊 Estado de contenedores:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}📋 Logs del Admin System:${NC}"
echo "=========================="
if docker ps | grep -q clinic-admin-system; then
    echo "Últimas 10 líneas:"
    docker logs clinic-admin-system --tail=10
    echo ""
    echo "Errores específicos:"
    docker logs clinic-admin-system 2>&1 | grep -i "error\|failed\|exception" | tail -5 || echo "Sin errores detectados"
else
    echo -e "${RED}❌ Contenedor clinic-admin-system no está corriendo${NC}"
fi

echo ""
echo -e "${BLUE}📋 Logs del Frontend Client:${NC}"
echo "============================"
if docker ps | grep -q clinic-frontend-client; then
    echo "Últimas 10 líneas:"
    docker logs clinic-frontend-client --tail=10
    echo ""
    echo "Errores específicos:"
    docker logs clinic-frontend-client 2>&1 | grep -i "error\|failed\|exception" | tail -5 || echo "Sin errores detectados"
else
    echo -e "${RED}❌ Contenedor clinic-frontend-client no está corriendo${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Análisis de problemas comunes:${NC}"
echo "=================================="

# Check for common issues
echo "Verificando problemas comunes..."

# Check if ports are in use
echo "Puertos en uso:"
netstat -tlnp | grep -E ":(60519|60521|27017)" || echo "Ningún puerto relevante en uso"

# Check Docker daemon
echo ""
echo "Estado de Docker:"
docker system info >/dev/null 2>&1 && echo -e "${GREEN}✅ Docker OK${NC}" || echo -e "${RED}❌ Docker Error${NC}"

# Check disk space
echo ""
echo "Espacio en disco:"
df -h / | tail -1 | awk '{print "Uso: " $5 " - Disponible: " $4}'

# Check memory
echo ""
echo "Memoria disponible:"
free -h | grep "Mem:" | awk '{print "Uso: " $3 "/" $2 " - Disponible: " $7}'

echo ""
read -p "Presiona Enter para continuar..."