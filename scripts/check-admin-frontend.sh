#!/bin/bash
# Script específico para diagnosticar frontend admin

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔍 CLINIC SYSTEM - ADMIN FRONTEND DIAGNOSTIC${NC}"
echo "============================================="

echo ""
echo -e "${BLUE}📊 Estado de contenedores:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}📋 LOGS ESPECÍFICOS DEL ADMIN SYSTEM${NC}"
echo "====================================="

echo "Últimas 30 líneas del admin system:"
docker logs clinic-admin-system --tail=30 2>&1

echo ""
echo -e "${BLUE}🔍 ERRORES ESPECÍFICOS EN ADMIN SYSTEM${NC}"
echo "======================================"
docker logs clinic-admin-system 2>&1 | grep -i "error\|exception\|failed\|traceback" | tail -10 || echo "Sin errores obvios detectados"

echo ""
echo -e "${BLUE}🌐 VERIFICACIÓN DE URLs ESPECÍFICAS${NC}"
echo "==================================="

echo "Probando API Docs (debería funcionar):"
curl -I http://localhost:60519/docs 2>/dev/null | head -1 || echo "❌ No responde"

echo ""
echo "Probando API Health (debería funcionar):"
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Health OK${NC}" || echo -e "${RED}❌ Health Error${NC}"

echo ""
echo "Probando Frontend Admin (problema reportado):"
admin_response=$(curl -I http://localhost:60519/admin 2>/dev/null | head -1)
if [[ $admin_response == *"200"* ]]; then
    echo -e "${GREEN}✅ Admin frontend responde 200${NC}"
elif [[ $admin_response == *"404"* ]]; then
    echo -e "${RED}❌ Admin frontend 404 - archivos no encontrados${NC}"
elif [[ $admin_response == *"500"* ]]; then
    echo -e "${RED}❌ Admin frontend 500 - error de servidor${NC}"
else
    echo -e "${YELLOW}⚠️ Admin frontend respuesta: $admin_response${NC}"
fi

echo ""
echo "Probando ruta de archivos estáticos admin:"
curl -I http://localhost:60519/admin/assets/ 2>/dev/null | head -1 || echo "❌ Assets no responden"

echo ""
echo -e "${BLUE}📁 VERIFICACIÓN DE ARCHIVOS ESTÁTICOS${NC}"
echo "====================================="

echo "Verificando estructura dentro del contenedor admin-system:"
docker exec clinic-admin-system ls -la /app/static/ 2>/dev/null || echo "❌ No se puede acceder a /app/static/"

echo ""
echo "Verificando archivos admin específicos:"
docker exec clinic-admin-system ls -la /app/static/admin/ 2>/dev/null || echo "❌ No se puede acceder a /app/static/admin/"

echo ""
echo "Verificando si index.html existe:"
docker exec clinic-admin-system ls -la /app/static/admin/index.html 2>/dev/null && echo -e "${GREEN}✅ index.html existe${NC}" || echo -e "${RED}❌ index.html NO existe${NC}"

echo ""
echo -e "${BLUE}🔧 VERIFICACIÓN DE CONFIGURACIÓN FASTAPI${NC}"
echo "========================================"

echo "Verificando configuración de archivos estáticos en main.py:"
docker exec clinic-admin-system grep -A 5 -B 5 "static" /app/main.py 2>/dev/null || echo "No se puede leer main.py"

echo ""
echo -e "${BLUE}🏗️ VERIFICACIÓN DE BUILD DEL FRONTEND${NC}"
echo "====================================="

echo "Verificando si el build del frontend se completó:"
docker exec clinic-admin-system find /app -name "dist" -type d 2>/dev/null || echo "No se encontró directorio dist"

echo ""
echo "Verificando archivos de build recientes:"
docker exec clinic-admin-system find /app/static/admin -name "*.js" -o -name "*.css" 2>/dev/null | head -5 || echo "No se encontraron archivos JS/CSS"

echo ""
echo -e "${BLUE}🔍 ANÁLISIS DE CONFIGURACIÓN DE RUTAS${NC}"
echo "===================================="

echo "Verificando configuración de rutas en FastAPI:"
curl -s http://localhost:60519/openapi.json 2>/dev/null | grep -o '"\/[^"]*"' | head -10 || echo "No se puede obtener configuración de rutas"

echo ""
echo -e "${BLUE}💡 DIAGNÓSTICO Y RECOMENDACIONES${NC}"
echo "==============================="

# Analyze the specific issue
if docker exec clinic-admin-system ls /app/static/admin/index.html >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend compilado existe${NC}"
    
    admin_status=$(curl -I http://localhost:60519/admin 2>/dev/null | head -1)
    if [[ $admin_status == *"404"* ]]; then
        echo -e "${RED}🔧 PROBLEMA: Archivos existen pero FastAPI no los sirve${NC}"
        echo "   Solución: Revisar configuración de static files en main.py"
    elif [[ $admin_status == *"500"* ]]; then
        echo -e "${RED}🔧 PROBLEMA: Error interno en servidor${NC}"
        echo "   Solución: Revisar logs de FastAPI"
    else
        echo -e "${YELLOW}🔧 PROBLEMA: Respuesta inesperada del servidor${NC}"
        echo "   Solución: Revisar configuración de rutas"
    fi
else
    echo -e "${RED}🔧 PROBLEMA: Frontend admin no compilado correctamente${NC}"
    echo "   Solución: Reconstruir imagen con frontend admin"
fi

echo ""
echo -e "${BLUE}📋 COMANDOS PARA SOLUCIONAR:${NC}"
if ! docker exec clinic-admin-system ls /app/static/admin/index.html >/dev/null 2>&1; then
    echo "1. Reconstruir imagen: docker-compose -f clinic-admin-backend/docker-compose.production.yml build --no-cache"
    echo "2. Recrear contenedor: docker-compose -f clinic-admin-backend/docker-compose.production.yml up -d --force-recreate"
else
    echo "1. Revisar logs detallados: docker logs clinic-admin-system -f"
    echo "2. Verificar configuración FastAPI en main.py"
fi

read -p "Presiona Enter para continuar..."