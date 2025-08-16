@echo off
REM Script para migrar a puertos de producción y coordinar con contenedores existentes

echo.
echo 🚀 CLINIC SYSTEM - PRODUCTION PORT MIGRATION
echo ============================================

echo.
echo 📊 ANÁLISIS DE CONTENEDORES EXISTENTES:
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🎯 ESTRATEGIA DE MIGRACIÓN:
echo.
echo ✅ MANTENER (ya en producción):
echo    clinic-backend-api     → Puerto 60519 (funcionando)
echo    clinic-admin-frontend  → Puerto 60523 (healthy)
echo.
echo 🔧 REPARAR:
echo    clinic-frontend-client → Migrar a puerto 60521
echo.
echo ⚠️ IMPORTANTE: No detendremos servicios funcionando
echo.

choice /c YN /m "¿Continuar con migración a puertos de producción?"
if errorlevel 2 goto cancel

echo.
echo 🔍 Verificando conflictos de puertos...

REM Verificar si puertos están ocupados
echo Verificando puerto 60519...
netstat -an | findstr ":60519" >nul && echo ✅ Puerto 60519 ocupado (backend existente) || echo ⚠️ Puerto 60519 libre

echo Verificando puerto 60521...
netstat -an | findstr ":60521" >nul && echo ❌ Puerto 60521 ocupado || echo ✅ Puerto 60521 libre

echo Verificando puerto 60523...
netstat -an | findstr ":60523" >nul && echo ✅ Puerto 60523 ocupado (admin existente) || echo ⚠️ Puerto 60523 libre

echo.
echo 🔧 PASO 1: Detener contenedor problemático frontend-client
docker stop clinic-frontend-client 2>nul || echo Frontend-client ya detenido
docker rm clinic-frontend-client 2>nul || echo Frontend-client ya eliminado

echo.
echo 🔧 PASO 2: Actualizar configuraciones para puertos de producción
cd /d "%~dp0\.."

REM Backup de configuraciones actuales
echo 📁 Creando backup de configuraciones...
copy docker-compose.yml docker-compose.yml.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2% >nul
copy clinic-admin-backend\docker-compose.admin.yml clinic-admin-backend\docker-compose.admin.yml.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2% >nul

echo.
echo 🔧 PASO 3: Iniciar frontend-client en puerto de producción 60521
docker-compose up -d frontend-client

echo.
echo ⏳ Esperando que frontend-client esté listo...
ping -n 11 127.0.0.1 >nul

echo.
echo 📊 VERIFICANDO ESTADO FINAL:
echo.
echo === CONTENEDORES CLINIC ===
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo === HEALTH CHECKS ===
echo Verificando Backend API (60519)...
curl -f http://localhost:60519/health 2>nul && echo ✅ Backend OK || echo ❌ Backend Error

echo Verificando Frontend Client (60521)...
curl -f http://localhost:60521 2>nul && echo ✅ Frontend Client OK || echo ❌ Frontend Client Error

echo Verificando Admin Frontend (60523)...
curl -f http://localhost:60523 2>nul && echo ✅ Admin Frontend OK || echo ❌ Admin Frontend Error

echo.
echo ✅ MIGRACIÓN COMPLETADA
echo =======================
echo.
echo 🌐 URLs DE PRODUCCIÓN:
echo    🔧 Backend API:      http://localhost:60519
echo    👥 Frontend Client:  http://localhost:60521
echo    🏥 Admin Frontend:   http://localhost:60523
echo.
echo 📋 SERVICIOS COORDINADOS:
echo    ✅ clinic-backend-api      (60519) - Mantenido
echo    ✅ clinic-admin-frontend   (60523) - Mantenido  
echo    🔧 clinic-frontend-client  (60521) - Migrado/Reparado
echo.

REM Abrir URLs de producción
echo 🌐 Abriendo URLs de producción...
start "" "http://localhost:60519/docs"
start "" "http://localhost:60521"
start "" "http://localhost:60523"

echo.
echo 🎉 SISTEMA COORDINADO EN PUERTOS DE PRODUCCIÓN
echo ===============================================
echo.
echo 📋 Próximos pasos:
echo    1. Verificar que todos los servicios funcionan correctamente
echo    2. Actualizar scripts de desarrollo para usar puertos de producción
echo    3. Verificar ApiDocumentationModal en http://localhost:60523
echo.
goto end

:cancel
echo.
echo ❌ Migración cancelada por el usuario
echo.

:end
pause