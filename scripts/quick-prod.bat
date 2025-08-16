@echo off
REM Script para actualizar servicios selectivamente en producción

echo.
echo 🚀 CLINIC SYSTEM - PRODUCTION UPDATER
echo =====================================

:menu
echo.
echo Selecciona una opcion:
echo 1. Actualizar SOLO Frontend Admin
echo 2. Actualizar SOLO Backend API  
echo 3. Actualizar Frontend Client Dashboard
echo 4. Actualizar TODO el sistema
echo 5. Ver estado de servicios
echo 6. Reiniciar servicios específicos
echo 7. Ver logs de errores
echo 8. Salir
echo.
set /p choice=Ingresa tu opcion (1-8): 

if "%choice%"=="1" goto update_frontend_admin
if "%choice%"=="2" goto update_backend
if "%choice%"=="3" goto update_frontend_client
if "%choice%"=="4" goto update_all
if "%choice%"=="5" goto status
if "%choice%"=="6" goto restart_menu
if "%choice%"=="7" goto error_logs
if "%choice%"=="8" goto end
echo Opcion invalida. Intenta de nuevo.
goto menu

:update_frontend_admin
echo.
echo 🎨 Actualizando SOLO Frontend Admin...
cd /d "%~dp0\..\clinic-admin-backend"
echo 📦 Instalando dependencias frontend...
cd frontend-admin
call npm install
echo 🔧 Compilando frontend...
call npm run build
cd ..
echo 📁 Copiando archivos compilados...
if exist "static\admin\" rmdir /s /q static\admin
mkdir static\admin
xcopy /E /Y frontend-admin\dist\* static\admin\
echo 🔄 Reiniciando solo el servicio admin...
docker-compose -f docker-compose.admin.yml restart clinic-admin-backend
echo ✅ Frontend Admin actualizado y reiniciado
goto menu

:update_backend
echo.
echo ⚙️ Actualizando SOLO Backend API...
cd /d "%~dp0\..\clinic-admin-backend"
echo 📦 Instalando dependencias Python...
docker-compose -f docker-compose.admin.yml exec clinic-admin-backend pip install -r requirements.txt
echo 🔄 Reiniciando backend...
docker-compose -f docker-compose.admin.yml restart clinic-admin-backend
echo ✅ Backend API actualizado y reiniciado
goto menu

:update_frontend_client
echo.
echo 👥 Actualizando Frontend Client Dashboard...
cd /d "%~dp0\.."
echo 📦 Instalando dependencias client...
call npm install
echo 🔧 Compilando client dashboard...
call npm run build
echo 🔄 Reiniciando servicio client...
docker-compose restart frontend-client
echo ✅ Frontend Client actualizado y reiniciado
goto menu

:update_all
echo.
echo 🔄 Actualizando TODO el sistema...
echo.
echo === ACTUALIZANDO ADMIN SYSTEM ===
cd /d "%~dp0\..\clinic-admin-backend"
echo 📦 Frontend Admin...
cd frontend-admin
call npm install
call npm run build
cd ..
if exist "static\admin\" rmdir /s /q static\admin
mkdir static\admin
xcopy /E /Y frontend-admin\dist\* static\admin\
echo 📦 Backend API...
docker-compose -f docker-compose.admin.yml exec clinic-admin-backend pip install -r requirements.txt
docker-compose -f docker-compose.admin.yml restart
echo.
echo === ACTUALIZANDO CLIENT DASHBOARD ===
cd /d "%~dp0\.."
echo 📦 Frontend Client...
call npm install
call npm run build
docker-compose restart frontend-client
echo ✅ TODO el sistema actualizado
goto menu

:status
echo.
echo 📊 Estado completo de servicios:
echo.
echo === ADMIN SYSTEM ===
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml ps
echo.
echo === CLIENT DASHBOARD ===
cd /d "%~dp0\.."
docker-compose ps
echo.
echo === HEALTHCHECKS ===
echo Verificando Admin System...
curl -f http://localhost:8000/health 2>nul && echo ✅ Admin OK || echo ❌ Admin Error
echo Verificando Client Dashboard...
curl -f http://localhost:8080 2>nul && echo ✅ Client OK || echo ❌ Client Error
goto menu

:restart_menu
echo.
echo 🔄 Reiniciar servicios específicos:
echo 1. Reiniciar Admin Backend
echo 2. Reiniciar Admin MongoDB
echo 3. Reiniciar Client Dashboard
echo 4. Reiniciar TODO Admin System
echo 5. Volver al menu principal
set /p restart_choice=Opcion: 

if "%restart_choice%"=="1" (
    cd /d "%~dp0\..\clinic-admin-backend"
    docker-compose -f docker-compose.admin.yml restart clinic-admin-backend
    echo ✅ Admin Backend reiniciado
)
if "%restart_choice%"=="2" (
    cd /d "%~dp0\..\clinic-admin-backend"
    docker-compose -f docker-compose.admin.yml restart mongodb-admin
    echo ✅ MongoDB Admin reiniciado
)
if "%restart_choice%"=="3" (
    cd /d "%~dp0\.."
    docker-compose restart frontend-client
    echo ✅ Client Dashboard reiniciado
)
if "%restart_choice%"=="4" (
    cd /d "%~dp0\..\clinic-admin-backend"
    docker-compose -f docker-compose.admin.yml restart
    echo ✅ Admin System completo reiniciado
)
if "%restart_choice%"=="5" goto menu
goto menu

:error_logs
echo.
echo 📋 Logs de errores:
echo.
echo === ADMIN BACKEND ERRORS ===
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml logs --tail=20 clinic-admin-backend | findstr "ERROR\|Error\|error\|WARN\|Warn\|warn"
echo.
echo === CLIENT DASHBOARD ERRORS ===
cd /d "%~dp0\.."
docker-compose logs --tail=20 frontend-client | findstr "ERROR\|Error\|error\|WARN\|Warn\|warn"
echo.
echo === MONGODB ERRORS ===
cd /d "%~dp0\..\clinic-admin-backend"
docker-compose -f docker-compose.admin.yml logs --tail=20 mongodb-admin | findstr "ERROR\|Error\|error\|WARN\|Warn\|warn"
pause
goto menu

:end
echo.
echo 👋 Saliendo del updater...
pause