#!/bin/bash
# ===========================================
# Script de Deployment para Producción
# Build Frontend + Deploy Backend Unificado
# ===========================================

set -e

echo "🚀 CLINIC DASHBOARD - DEPLOYMENT PRODUCCIÓN"
echo "============================================"

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

# Función para manejo de errores
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Verificar que estamos en el directorio correcto
if [ ! -f "../package.json" ]; then
    error_exit "package.json no encontrado. Ejecuta desde clinic-admin-backend/scripts/"
fi

if [ ! -f "../frontend-admin/package.json" ]; then
    error_exit "Frontend admin no encontrado. Verifica la migración."
fi

# Paso 1: Build del Frontend React
echo -e "${BLUE}📦 PASO 1: Building Frontend React...${NC}"
cd ../frontend-admin

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependencias frontend...${NC}"
    npm ci --only=production
fi

# Build para producción
echo -e "${YELLOW}🔨 Building para producción...${NC}"
npm run build || error_exit "Build del frontend falló"

# Verificar que el build se completó
if [ ! -d "dist" ]; then
    error_exit "Directorio dist no encontrado después del build"
fi

echo -e "${GREEN}✅ Frontend build completado${NC}"

# Paso 2: Preparar static files para el backend
echo -e "${BLUE}📂 PASO 2: Preparando archivos estáticos...${NC}"
cd ..

# Crear directorio static si no existe
mkdir -p static/admin

# Copiar build del frontend
echo -e "${YELLOW}📋 Copiando archivos del build...${NC}"
cp -r frontend-admin/dist/* static/admin/ || error_exit "Error copiando archivos estáticos"

echo -e "${GREEN}✅ Archivos estáticos preparados${NC}"

# Paso 3: Detener servicios previos
echo -e "${BLUE}🛑 PASO 3: Deteniendo servicios previos...${NC}"
docker-compose -f ../docker-compose.unified.yml --profile production down 2>/dev/null || true
docker-compose -f ../docker-compose.unified.yml --profile development down 2>/dev/null || true

# Paso 4: Build y Deploy del contenedor unificado
echo -e "${BLUE}🐳 PASO 4: Building contenedor unificado...${NC}"
docker-compose -f ../docker-compose.unified.yml --profile production build || error_exit "Build del contenedor falló"

# Paso 5: Iniciar en producción
echo -e "${BLUE}🚀 PASO 5: Iniciando en modo PRODUCCIÓN...${NC}"
docker-compose -f ../docker-compose.unified.yml --profile production up -d || error_exit "Inicio del contenedor falló"

# Verificar que el servicio está corriendo
echo -e "${YELLOW}⏳ Verificando que el servicio esté listo...${NC}"
sleep 10

# Health check
for i in {1..30}; do
    if curl -f http://localhost:60519/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Servicio está respondiendo${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        error_exit "Servicio no responde después de 30 intentos"
    fi
    echo -n "."
    sleep 2
done

# Mostrar estado final
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
echo "============================================"
echo -e "🌐 Aplicación: ${BLUE}http://localhost:60519/admin${NC}"
echo -e "🔧 API:        ${BLUE}http://localhost:60519/api${NC}"
echo -e "📚 Docs:       ${BLUE}http://localhost:60519/docs${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}📊 Estado del contenedor:${NC}"
docker-compose -f ../docker-compose.unified.yml --profile production ps

echo ""
echo -e "${YELLOW}📝 Para ver logs:${NC}"
echo "docker-compose -f docker-compose.unified.yml --profile production logs -f"
echo ""
echo -e "${YELLOW}📝 Para actualizar el frontend:${NC}"
echo "1. Haz cambios en /src"
echo "2. Ejecuta: ./prod-deploy.sh"
echo ""
echo -e "${GREEN}✨ ¡Todo listo para producción!${NC}"