@echo off
REM Script maestro para iniciar todo el entorno de desarrollo

echo.
echo 🚀 CLINIC SYSTEM - COMPLETE DEVELOPMENT ENVIRONMENT
echo ==================================================

echo.
echo Este script iniciará TODOS los servicios de desarrollo:
echo.
echo 🏥 Admin System (puerto 8000)
echo    - Backend API con FastAPI
echo    - Frontend Admin compilado
echo    - MongoDB para admin
echo.
echo 👥 Client Dashboard (puerto 8080) 
echo    - Frontend React en modo desarrollo
echo    - Conexión a backend existente
echo.
echo ⚠️ IMPORTANTE: Asegúrate de tener Docker corriendo
echo.
pause

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado o no está corriendo
    pause
    exit /b 1
)

echo.
echo 🔧 Iniciando Admin System...
cd /d "%~dp0\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml up -d

echo.
echo ⏳ Esperando que Admin System esté listo...
ping -n 11 127.0.0.1 >nul

echo.
echo 🔧 Iniciando Client Dashboard...
cd /d "%~dp0"
docker-compose up -d frontend-client

echo.
echo ⏳ Esperando que Client Dashboard esté listo...
ping -n 11 127.0.0.1 >nul

echo.
echo 📊 Verificando estado de servicios...
echo.
echo === ADMIN SYSTEM ===
cd /d "%~dp0\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml ps

echo.
echo === CLIENT DASHBOARD ===
cd /d "%~dp0"
docker-compose ps frontend-client

echo.
echo 💚 Verificando health checks...
curl -f http://localhost:60519/health 2>nul && echo ✅ Admin System OK || echo ⚠️ Admin System iniciando...
curl -f http://localhost:60521 2>nul && echo ✅ Client Dashboard OK || echo ⚠️ Client Dashboard iniciando...

echo.
echo ✅ ENTORNO COMPLETO INICIADO
echo ============================
echo.
echo 🖥️ URLs disponibles:
echo.
echo 🏥 ADMIN SYSTEM:
echo    - Dashboard: http://localhost:60519/admin
echo    - API:       http://localhost:60519/api
echo    - Docs:      http://localhost:60519/docs
echo    - Health:    http://localhost:60519/health
echo.
echo 👥 CLIENT DASHBOARD:
echo    - Dashboard: http://localhost:60521
echo.
echo 🔐 Credenciales Admin:
echo    - Usuario: admin
echo    - Contraseña: admin123
echo.
echo 📋 Para acceder al ApiDocumentationModal:
echo    1. Ir a http://localhost:60519/admin
echo    2. Login con credenciales admin
echo    3. Tab 'Clínicas' → Botón 'Documentación'
echo.
echo 📋 Comandos útiles:
echo    - Ver logs admin:   docker-compose -f clinic-admin-backend\docker-compose.admin.yml logs -f
echo    - Ver logs client:  docker-compose logs -f frontend-client
echo    - Parar todo:       scripts\quick-dev.bat (opción 5)
echo    - Gestión avanzada: scripts\quick-dev.bat
echo.

REM Abrir URLs automáticamente
echo 🌐 Abriendo URLs en el navegador...
start "" "http://localhost:60519/admin"
start "" "http://localhost:60521"

echo.
echo 🎉 LISTO! Los servicios están corriendo
echo =======================================
echo.
echo ⚠️ Para gestión avanzada de servicios, usar:
echo    scripts\quick-dev.bat - Desarrollo
echo    scripts\quick-prod.bat - Producción/Updates
echo.
pause