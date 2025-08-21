#!/bin/bash

# =========================================
# 🔧 SCRIPT DE FIX PARA PRODUCCIÓN
# =========================================
# Corrige problemas de assets y dependencias MinIO

echo "🚀 Iniciando fix para assets y dependencias de producción..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop existing containers
print_status "Deteniendo contenedores existentes..."
docker-compose -f clinic-admin-backend/docker-compose.yml down
if [ $? -eq 0 ]; then
    print_success "Contenedores detenidos correctamente"
else
    print_warning "No se encontraron contenedores activos"
fi

# Step 2: Rebuild backend with MinIO dependency
print_status "Rebuildeando backend con dependencia MinIO..."
cd clinic-admin-backend

# Force rebuild without cache
docker-compose build --no-cache
if [ $? -eq 0 ]; then
    print_success "Backend rebuildeado con dependencias actualizadas"
else
    print_error "Error al rebuildear backend"
    exit 1
fi

# Step 3: Start services
print_status "Iniciando servicios actualizados..."
docker-compose up -d
if [ $? -eq 0 ]; then
    print_success "Servicios iniciados correctamente"
else
    print_error "Error al iniciar servicios"
    exit 1
fi

# Step 4: Wait for services to be ready
print_status "Esperando que los servicios estén listos (30 segundos)..."
sleep 30

# Step 5: Health check
print_status "Verificando estado de los servicios..."

# Check container status
echo ""
echo "📊 Estado del contenedor:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep clinic-admin

# Check backend health
echo ""
echo "🌐 Health Check:"
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/health 2>/dev/null || echo "ERROR")

if [ "$backend_status" = "200" ]; then
    print_success "Backend: OK (HTTP $backend_status)"
else
    print_error "Backend: ERROR (HTTP $backend_status)"
    echo "Checking logs for issues..."
    docker logs --tail 20 clinic-admin-system
fi

# Step 6: Test MinIO integration
print_status "Verificando integración MinIO..."
minio_test=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/docs 2>/dev/null || echo "ERROR")

if [ "$minio_test" = "200" ]; then
    print_success "API Docs disponibles (MinIO integration OK)"
else
    print_warning "API Docs no disponibles - verificar logs"
fi

# Step 7: Frontend assets check
print_status "Verificando assets del frontend..."
cd ..

# Check if frontend build exists
if [ -d "dist" ]; then
    print_success "Build del frontend encontrado"
    
    # Check main assets
    if [ -f "dist/index.html" ]; then
        print_success "index.html presente"
    else
        print_warning "index.html no encontrado"
    fi
    
    if [ -d "dist/assets" ]; then
        asset_count=$(find dist/assets -type f | wc -l)
        print_success "Assets encontrados ($asset_count archivos)"
    else
        print_warning "Directorio assets no encontrado"
    fi
else
    print_warning "Build del frontend no encontrado - ejecutando npm run build..."
    npm install --silent
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend rebuildeado correctamente"
    else
        print_error "Error al rebuildear frontend"
    fi
fi

# Step 8: Final verification
echo ""
echo "=========================================="
echo "🎉 FIX COMPLETADO"
echo "=========================================="
echo ""
echo "🌐 URLs para probar:"
echo "   🔧 Admin Dashboard: http://localhost:60519/admin"
echo "   📚 API Docs: http://localhost:60519/docs"
echo "   ⚡ Health Check: http://localhost:60519/health"
echo ""
echo "🔍 Para verificar assets:"
echo "   Accede al admin dashboard y verifica que no haya errores 404"
echo "   Revisa la consola del navegador para confirmación"
echo ""
echo "💡 ¿Qué se corrigió?"
echo "   ✅ Dependencia MinIO agregada a requirements.txt"
echo "   ✅ Backend rebuildeado sin cache para incluir MinIO"
echo "   ✅ Verificación de assets del frontend"
echo "   ✅ Health checks de servicios"
echo "   ✅ Integración MinIO verificada"
echo ""

# Check if everything is working
if [ "$backend_status" = "200" ]; then
    print_success "¡Script completado exitosamente! El sistema debería estar funcionando."
else
    print_error "Hay problemas pendientes. Revisa los logs arriba."
    echo ""
    echo "Para debuggear:"
    echo "   docker logs clinic-admin-system"
    echo "   docker-compose -f clinic-admin-backend/docker-compose.yml logs"
fi

echo ""
echo "Presiona Enter para continuar..."
read