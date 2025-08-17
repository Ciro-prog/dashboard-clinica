#!/bin/bash
# Script para diagnosticar problemas de restart loop

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}🚨 CLINIC SYSTEM - RESTART LOOP DIAGNOSTIC${NC}"
echo "============================================"

echo ""
echo -e "${BLUE}📊 Estado actual de contenedores:${NC}"
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${RED}🔍 DIAGNÓSTICO ADMIN SYSTEM${NC}"
echo "============================"

if docker ps | grep -q clinic-admin-system; then
    echo -e "${YELLOW}📋 Últimos logs del admin system:${NC}"
    docker logs clinic-admin-system --tail=20
    
    echo ""
    echo -e "${YELLOW}🔍 Errores específicos:${NC}"
    docker logs clinic-admin-system 2>&1 | grep -i "error\|exception\|failed\|traceback" | tail -10 || echo "Sin errores obvios en logs"
    
    echo ""
    echo -e "${YELLOW}🔧 Variables de entorno del contenedor:${NC}"
    docker exec clinic-admin-system env | grep -E "MONGODB|ADMIN|API|CORS|ENVIRONMENT" || echo "No se puede acceder - contenedor reiniciando"
    
else
    echo -e "${RED}❌ Contenedor clinic-admin-system no está corriendo${NC}"
fi

echo ""
echo -e "${RED}🔍 DIAGNÓSTICO FRONTEND CLIENT${NC}"
echo "==============================="

if docker ps | grep -q clinic-frontend-client; then
    echo -e "${YELLOW}📋 Últimos logs del frontend client:${NC}"
    docker logs clinic-frontend-client --tail=20
    
    echo ""
    echo -e "${YELLOW}🔍 Errores específicos:${NC}"
    docker logs clinic-frontend-client 2>&1 | grep -i "error\|exception\|failed" | tail -10 || echo "Sin errores obvios en logs"
    
else
    echo -e "${RED}❌ Contenedor clinic-frontend-client no está corriendo${NC}"
fi

echo ""
echo -e "${BLUE}🌐 CONECTIVIDAD EXTERNA${NC}"
echo "======================="

echo "Verificando conectividad a MongoDB externa..."
ping -c 1 192.168.1.23 >/dev/null && echo -e "${GREEN}✅ IP 192.168.1.23 accesible${NC}" || echo -e "${RED}❌ IP 192.168.1.23 no accesible${NC}"

echo ""
echo "Verificando puerto MongoDB (60516)..."
nc -z 192.168.1.23 60516 >/dev/null 2>&1 && echo -e "${GREEN}✅ Puerto 60516 abierto${NC}" || echo -e "${RED}❌ Puerto 60516 cerrado${NC}"

echo ""
echo "Verificando conectividad MongoDB desde este servidor..."
timeout 5 mongosh "mongodb://root:servermuenpampa2025A!@192.168.1.23:60516/clinic_admin?authSource=admin" --eval "db.adminCommand('ping')" 2>/dev/null && echo -e "${GREEN}✅ MongoDB conecta OK${NC}" || echo -e "${YELLOW}⚠️ MongoDB no conecta (puede ser normal si mongosh no está instalado)${NC}"

echo ""
echo -e "${BLUE}🔍 ANÁLISIS DE CONFIGURACIONES${NC}"
echo "==============================="

echo "Verificando archivos de configuración creados..."
if [ -f "/opt/dashboard-clinica/clinic-admin-backend/.env.prod" ]; then
    echo -e "${GREEN}✅ .env.prod existe${NC}"
    echo "Contenido de MONGODB_URL:"
    grep MONGODB_URL /opt/dashboard-clinica/clinic-admin-backend/.env.prod || echo "MONGODB_URL no encontrada"
else
    echo -e "${RED}❌ .env.prod no encontrado${NC}"
fi

echo ""
if [ -f "/opt/dashboard-clinica/clinic-admin-backend/docker-compose.production.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.production.yml existe${NC}"
    echo "Verificando MONGODB_URL en docker-compose:"
    grep -A 1 -B 1 MONGODB_URL /opt/dashboard-clinica/clinic-admin-backend/docker-compose.production.yml || echo "MONGODB_URL no encontrada"
else
    echo -e "${RED}❌ docker-compose.production.yml no encontrado${NC}"
fi

echo ""
echo -e "${BLUE}📋 RECURSOS DEL SISTEMA${NC}"
echo "======================="

echo "Memoria disponible:"
free -h | grep "Mem:" | awk '{print "Usado: " $3 "/" $2 " - Disponible: " $7}'

echo ""
echo "Espacio en disco:"
df -h / | tail -1 | awk '{print "Uso: " $5 " - Disponible: " $4}'

echo ""
echo "Procesos usando puertos relevantes:"
ss -tulnp | grep -E ":(60519|60521|27017)" || echo "Ningún proceso en puertos relevantes"

echo ""
echo -e "${YELLOW}💡 RECOMENDACIONES BASADAS EN ANÁLISIS:${NC}"
echo "======================================"

# Check most common issues
admin_logs=$(docker logs clinic-admin-system 2>&1 | tail -10)
client_logs=$(docker logs clinic-frontend-client 2>&1 | tail -10)

if echo "$admin_logs" | grep -qi "connection.*refused\|mongodb.*error\|database.*error"; then
    echo -e "${RED}🔧 PROBLEMA DETECTADO: Error de conexión a MongoDB${NC}"
    echo "   Solución: Verificar configuración de MONGODB_URL y conectividad"
fi

if echo "$admin_logs" | grep -qi "import.*error\|module.*not.*found"; then
    echo -e "${RED}🔧 PROBLEMA DETECTADO: Error de importación Python${NC}"
    echo "   Solución: Verificar requirements.txt y dependencias"
fi

if echo "$admin_logs" | grep -qi "port.*in.*use\|address.*already.*in.*use"; then
    echo -e "${RED}🔧 PROBLEMA DETECTADO: Puerto en uso${NC}"
    echo "   Solución: Verificar conflictos de puertos"
fi

if echo "$client_logs" | grep -qi "connection.*refused\|502\|503"; then
    echo -e "${RED}🔧 PROBLEMA DETECTADO: Frontend no puede conectar al backend${NC}"
    echo "   Solución: Verificar que el backend esté funcionando primero"
fi

echo ""
echo -e "${BLUE}📋 SIGUIENTE PASO RECOMENDADO:${NC}"
echo "Ejecutar: ./fix-restart-issues.sh (próximo script a crear)"

read -p "Presiona Enter para continuar..."