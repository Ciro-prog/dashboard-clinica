@echo off
REM Script para iniciar el Sistema Admin en Windows

echo.
echo 🏥 CLINIC ADMIN SYSTEM - DOCKER
echo ================================

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

REM Crear directorios necesarios
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo 🔧 Construyendo imagen admin...
docker-compose -f docker-compose.admin.yml build

echo 🚀 Iniciando servicios admin...
docker-compose -f docker-compose.admin.yml up -d

echo ⏳ Esperando que los servicios estén listos...
timeout /t 10 /nobreak >nul

REM Verificar estado de servicios
echo 🔍 Verificando estado de servicios...
docker-compose -f docker-compose.admin.yml ps

REM Verificar salud del sistema
echo 💚 Verificando salud del sistema...
curl -f http://localhost:8000/health 2>nul || echo ⚠️ Sistema aún iniciando...

echo.
echo ✅ SISTEMA ADMIN INICIADO
echo =========================
echo 🖥️  Admin Dashboard: http://localhost:8000/admin
echo 🔧  Backend API:     http://localhost:8000/api  
echo 📚  API Docs:        http://localhost:8000/docs
echo.
echo 🔐 Credenciales Admin:
echo    Usuario: admin
echo    Contraseña: admin123
echo.
echo 📋 Comandos útiles:
echo    Ver logs:     docker-compose -f docker-compose.admin.yml logs -f
echo    Parar:        docker-compose -f docker-compose.admin.yml down
echo    Reiniciar:    docker-compose -f docker-compose.admin.yml restart

pause