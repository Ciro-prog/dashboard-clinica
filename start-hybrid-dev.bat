@echo off
REM Script para desarrollo híbrido: Backend Docker + Frontend standalone
REM RECOMENDADO para desarrollo del frontend admin

echo.
echo ========================================
echo  CLINIC SYSTEM - DESARROLLO HIBRIDO
echo ========================================
echo.
echo ✅ Backend en Docker (conectividad DB)
echo ✅ Frontend standalone (hot-reload)
echo.

REM Iniciar backend en Docker
echo 🐳 Iniciando backend en Docker...
cd clinic-admin-backend
docker-compose -f docker-compose.local.yml up -d

if errorlevel 1 (
    echo ❌ Error iniciando backend Docker
    pause
    exit /b 1
)

echo.
echo Esperando que backend Docker inicie...
timeout /t 15

echo.
echo 🧪 Verificando backend...
curl -f http://localhost:8000/health 2>nul && (
    echo ✅ Backend Docker: OK
) || (
    echo ❌ Backend Docker: Error
    echo Verificando logs...
    docker logs clinic-admin-local --tail=10
)

echo.
echo ========================================
echo  FRONTEND STANDALONE
echo ========================================
echo.

REM Cambiar al directorio del frontend
cd frontend-admin

echo Verificando Node.js...
node --version || (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo.
echo Instalando dependencias del frontend...
npm install

echo.
echo 🎯 DESARROLLO HÍBRIDO LISTO
echo ========================================
echo.
echo URLs de desarrollo:
echo   🔧 Backend API: http://localhost:8000/docs
echo   🔧 Backend Admin: http://localhost:8000/admin
echo   🎯 Frontend Dev: http://localhost:5173 (se abrirá)
echo.
echo 📝 Para aplicar cambios:
echo   1. Modifica archivos en frontend-admin/
echo   2. Hot-reload automático en http://localhost:5173
echo   3. API calls van a http://localhost:8000
echo.
echo 🚀 Iniciando frontend con hot-reload...
npm run dev