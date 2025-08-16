@echo off
REM Script para iniciar servicios de desarrollo selectivamente

echo.
echo 🚀 CLINIC SYSTEM - DEVELOPMENT MANAGER
echo =====================================

:menu
echo.
echo Selecciona una opcion:
echo 1. Iniciar SOLO Admin System (puerto 8000)
echo 2. Iniciar SOLO Client Dashboard (puerto 8080)
echo 3. Iniciar AMBOS servicios
echo 4. Ver estado de servicios
echo 5. Parar TODOS los servicios
echo 6. Ver logs en tiempo real
echo 7. Salir
echo.
set /p choice=Ingresa tu opcion (1-7): 

if "%choice%"=="1" goto start_admin
if "%choice%"=="2" goto start_client
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto status
if "%choice%"=="5" goto stop_all
if "%choice%"=="6" goto logs
if "%choice%"=="7" goto end
echo Opcion invalida. Intenta de nuevo.
goto menu

:start_admin
echo.
echo 🏥 Iniciando SOLO Admin System...
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml up -d
echo ✅ Admin System iniciado en http://localhost:60519/admin
goto menu

:start_client
echo.
echo 👥 Iniciando SOLO Client Dashboard...
cd /d "%~dp0\.."
docker-compose up -d frontend-client
echo ✅ Client Dashboard iniciado en http://localhost:60521
goto menu

:start_both
echo.
echo 🔄 Iniciando AMBOS servicios...
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml up -d
cd /d "%~dp0\.."
docker-compose up -d frontend-client
echo ✅ Admin System: http://localhost:60519/admin
echo ✅ Client Dashboard: http://localhost:60521
goto menu

:status
echo.
echo 📊 Estado de servicios:
echo.
echo === ADMIN SYSTEM ===
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml ps
echo.
echo === CLIENT DASHBOARD ===
cd /d "%~dp0\.."
docker-compose ps frontend-client
echo.
goto menu

:stop_all
echo.
echo ⏹️ Parando TODOS los servicios...
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml down
cd /d "%~dp0\.."
docker-compose down
echo ✅ Todos los servicios detenidos
goto menu

:logs
echo.
echo 📋 Selecciona logs para ver:
echo 1. Admin System logs
echo 2. Client Dashboard logs
echo 3. Volver al menu principal
set /p log_choice=Opcion: 

if "%log_choice%"=="1" (
    cd /d "%~dp0\..\clinic-admin-backend"
    docker-compose -f docker-compose.admin.yml logs -f
)
if "%log_choice%"=="2" (
    cd /d "%~dp0\.."
    docker-compose logs -f frontend-client
)
if "%log_choice%"=="3" goto menu
goto menu

:end
echo.
echo 👋 Saliendo...
pause