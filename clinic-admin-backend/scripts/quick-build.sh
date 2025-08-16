#!/bin/bash
# ===========================================
# Script rápido para build y testing
# ===========================================

set -e

echo "🔨 CLINIC DASHBOARD - QUICK BUILD TEST"
echo "======================================"

cd "$(dirname "$0")/.."

# Test 1: Verificar estructura
echo "📁 Verificando estructura..."
if [ ! -f "frontend-admin/package.json" ]; then
    echo "❌ frontend-admin/package.json no encontrado"
    exit 1
fi

# Test 2: Instalar dependencias si es necesario
if [ ! -d "frontend-admin/node_modules" ]; then
    echo "📦 Instalando dependencias..."
    cd frontend-admin && npm ci && cd ..
fi

# Test 3: Build del frontend (método simplificado)
echo "🔨 Building frontend (método directo)..."
cd frontend-admin

# Crear build simple usando el proyecto original
echo "🔄 Usando build desde proyecto original..."
cd ../../src
npm run build

# Copiar el build generado
echo "📋 Copiando build al backend..."
rm -rf ../clinic-admin-backend/static/admin
mkdir -p ../clinic-admin-backend/static/admin
cp -r dist/* ../clinic-admin-backend/static/admin/

echo "✅ Build completado"
echo "📊 Verificando archivos:"
ls -la ../clinic-admin-backend/static/admin/

echo ""
echo "🎉 Build listo para testing"
echo "Para probar: cd .. && python main.py"