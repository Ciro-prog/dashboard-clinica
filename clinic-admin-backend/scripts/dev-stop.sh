#!/bin/bash
# ===========================================
# Script para Detener Modo Desarrollo
# ===========================================

set -e

echo "🛑 DETENIENDO SERVICIOS DE DESARROLLO"
echo "====================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detener servicios de desarrollo
echo -e "${YELLOW}🛑 Deteniendo contenedores de desarrollo...${NC}"
docker-compose -f ../docker-compose.unified.yml --profile development down

# Limpiar volúmenes si se solicita
if [ "$1" = "--clean" ]; then
    echo -e "${YELLOW}🧹 Limpiando volúmenes...${NC}"
    docker-compose -f ../docker-compose.unified.yml --profile development down -v
fi

echo -e "${GREEN}✅ Servicios detenidos correctamente${NC}"
echo ""
echo -e "${BLUE}Para reiniciar en modo desarrollo:${NC}"
echo "./dev-start.sh"