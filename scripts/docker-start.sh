#!/bin/bash

# Script para iniciar Dashboard Clínica con Docker
# Uso: ./scripts/docker-start.sh [development|production]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log() {
    echo -e "${GREEN}[CLINIC-DOCKER]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
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
║          🏥 DASHBOARD CLÍNICA DOCKER          ║
║                                               ║
║  Frontend Cliente:  http://localhost:60521   ║
║  Backend API:       http://localhost:60522   ║
║  Admin Frontend:    http://localhost:60523   ║
║  MongoDB:           localhost:60516           ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Detectar modo (development por defecto)
MODE=${1:-development}

if [[ "$MODE" != "development" && "$MODE" != "production" ]]; then
    error "Modo inválido: $MODE"
    error "Usa: $0 [development|production]"
    exit 1
fi

log "🚀 Iniciando en modo: $MODE"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado o no está en PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose no está disponible"
    exit 1
fi

# Verificar si existe .env
if [ ! -f .env ]; then
    warning "Archivo .env no encontrado"
    info "Copiando .env.example a .env..."
    cp .env.example .env
    warning "Por favor configura las variables en .env antes de continuar"
    warning "Especialmente: ADMIN_SECRET_KEY, API_SECRET_KEY"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar conexión MongoDB existente
log "🔍 Verificando contenedor MongoDB existente..."
if docker ps | grep -q "60516->27017"; then
    log "✅ MongoDB encontrado en puerto 60516"
else
    warning "No se encontró MongoDB en puerto 60516"
    warning "Verifica que el contenedor esté ejecutándose:"
    warning "docker ps | grep mongo"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Construir imágenes
log "🔨 Construyendo imágenes Docker..."

if [ "$MODE" == "development" ]; then
    # Construir con cache para desarrollo
    docker-compose build --parallel || {
        error "Falló la construcción de imágenes"
        exit 1
    }
else
    # Construir sin cache para producción
    docker-compose build --no-cache --parallel || {
        error "Falló la construcción de imágenes"
        exit 1
    }
fi

# Detener contenedores existentes si están corriendo
log "🛑 Deteniendo contenedores existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Iniciar servicios
log "🚀 Iniciando servicios..."

if [ "$MODE" == "development" ]; then
    # Modo desarrollo - todos los servicios
    docker-compose --profile development up -d || {
        error "Falló el inicio de servicios en modo desarrollo"
        exit 1
    }
else
    # Modo producción - sin admin frontend
    docker-compose --profile production up -d || {
        error "Falló el inicio de servicios en modo producción"
        exit 1
    }
fi

# Esperar a que los servicios estén listos
log "⏳ Esperando que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
log "📊 Estado de los servicios:"
docker-compose ps

# Health checks
log "🔍 Verificando conectividad..."

check_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    info "Verificando $name en $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "✅ $name está listo"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "❌ $name no responde después de $max_attempts intentos"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
}

# Verificar servicios principales
check_service "Backend API" "http://localhost:60522/health" || warning "Backend API no responde"
check_service "Frontend Cliente" "http://localhost:60521" || warning "Frontend Cliente no responde"

if [ "$MODE" == "development" ]; then
    check_service "Admin Frontend" "http://localhost:60523" || warning "Admin Frontend no responde"
fi

# Mostrar URLs finales
echo -e "\n${GREEN}🎉 ¡Dashboard Clínica iniciado exitosamente!${NC}"
echo -e "${BLUE}📱 Frontend Cliente:${NC}   http://localhost:60521"
echo -e "${BLUE}🔧 Backend API:${NC}        http://localhost:60522"
echo -e "${BLUE}📊 API Docs:${NC}           http://localhost:60522/docs"

if [ "$MODE" == "development" ]; then
    echo -e "${BLUE}👨‍💻 Admin Frontend:${NC}    http://localhost:60523"
fi

echo -e "\n${YELLOW}💡 Comandos útiles:${NC}"
echo -e "  Ver logs:           docker-compose logs -f"
echo -e "  Detener servicios:  docker-compose down"
echo -e "  Reiniciar:          ./scripts/docker-restart.sh"
echo -e "  Estado:             docker-compose ps"

log "🏥 Dashboard Clínica listo para usar!"