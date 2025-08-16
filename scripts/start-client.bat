@echo off
REM Script para iniciar el Dashboard de Clientes

echo.
echo 🏥 CLINIC CLIENT DASHBOARD - DOCKER
echo ===================================

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está instalado
    pause
    exit /b 1
)

REM Cambiar al directorio del script
cd /d "%~dp0\.."

echo 🔧 Construyendo imagen del dashboard de clientes...
docker-compose -f docker-compose.client.yml build

echo 🚀 Iniciando dashboard de clientes...
docker-compose -f docker-compose.client.yml up -d

echo ⏳ Esperando que el servicio esté listo...
timeout /t 10 /nobreak >nul

REM Verificar estado del servicio
echo 🔍 Verificando estado del servicio...
docker-compose -f docker-compose.client.yml ps

echo.
echo ✅ DASHBOARD DE CLIENTES INICIADO
echo ================================
echo 🏥  Client Dashboard: http://localhost:8080
echo 🌐  Nginx Proxy:     http://localhost (opcional)
echo.
echo 📋 Información:
echo    - Dashboard para acceso de clínicas y profesionales
echo    - Se conecta al Admin System en puerto 8000
echo    - Incluye WhatsApp, N8N y gestión de pacientes
echo.
echo 📋 Comandos útiles:
echo    Ver logs:     docker-compose -f docker-compose.client.yml logs -f
echo    Parar:        docker-compose -f docker-compose.client.yml down
echo    Reiniciar:    docker-compose -f docker-compose.client.yml restart

pause