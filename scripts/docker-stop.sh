#!/bin/bash

# Script para detener Dashboard Clínica Docker
# Uso: ./scripts/docker-stop.sh [--clean]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[CLINIC-DOCKER]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
echo -e "${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════╗
║        🛑 DETENIENDO DASHBOARD CLÍNICA         ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

CLEAN_MODE=false

if [[ "$1" == "--clean" ]]; then
    CLEAN_MODE=true
    warning "Modo limpieza activado - se eliminarán imágenes y volúmenes"
fi

# Detener servicios
log "🛑 Deteniendo servicios..."
docker-compose down --remove-orphans

if [ "$CLEAN_MODE" == "true" ]; then
    log "🧹 Eliminando imágenes de Dashboard Clínica..."
    
    # Eliminar imágenes específicas del proyecto
    docker images | grep "dashboard-clinica" | awk '{print $3}' | xargs -r docker rmi -f
    docker images | grep "clinic-" | awk '{print $3}' | xargs -r docker rmi -f
    
    log "🗑️ Eliminando volúmenes..."
    docker-compose down -v
    
    # Eliminar volúmenes específicos si existen
    docker volume rm clinic-backend-uploads 2>/dev/null || true
    docker volume rm clinic-backend-logs 2>/dev/null || true
    docker volume rm clinic-admin-logs 2>/dev/null || true
    
    log "🧽 Limpiando imágenes no utilizadas..."
    docker system prune -f
    
    log "✅ Limpieza completa terminada"
else
    log "ℹ️ Servicios detenidos (use --clean para limpieza completa)"
fi

# Mostrar estado final
info "📊 Estado final de contenedores:"
docker-compose ps

log "🏥 Dashboard Clínica detenido exitosamente"