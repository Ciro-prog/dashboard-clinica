#!/bin/bash

# Script para iniciar el Sistema Admin
echo "🏥 CLINIC ADMIN SYSTEM - DOCKER"
echo "================================"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear directorios necesarios
mkdir -p uploads logs

echo "🔧 Construyendo imagen admin..."
docker-compose -f docker-compose.admin.yml build

echo "🚀 Iniciando servicios admin..."
docker-compose -f docker-compose.admin.yml up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

# Verificar salud de servicios
echo "🔍 Verificando estado de servicios..."
docker-compose -f docker-compose.admin.yml ps

# Verificar salud del admin system
echo "💚 Verificando salud del sistema..."
curl -f http://localhost:8000/health || echo "⚠️ Sistema aún iniciando..."

echo ""
echo "✅ SISTEMA ADMIN INICIADO"
echo "========================="
echo "🖥️  Admin Dashboard: http://localhost:8000/admin"
echo "🔧  Backend API:     http://localhost:8000/api"
echo "📚  API Docs:        http://localhost:8000/docs"
echo ""
echo "🔐 Credenciales Admin:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker-compose -f docker-compose.admin.yml logs -f"
echo "   Parar:        docker-compose -f docker-compose.admin.yml down"
echo "   Reiniciar:    docker-compose -f docker-compose.admin.yml restart"