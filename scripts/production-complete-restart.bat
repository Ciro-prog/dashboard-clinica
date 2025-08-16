@echo off
REM Script para restart completo con configuraciones de producción actualizadas

echo.
echo 🔄 CLINIC SYSTEM - PRODUCTION COMPLETE RESTART
echo ==============================================

echo.
echo ⚠️ IMPORTANTE: Este script aplicará TODAS las mejoras de reestructuración
echo    - Detendrá servicios obsoletos
echo    - Aplicará configuraciones de producción
echo    - Conectará a DB externa: 192.168.1.23:60516
echo    - Configurará URLs de producción: pampaservers.com
echo.

choice /c YN /m "¿Continuar con restart completo?"
if errorlevel 2 goto cancel

echo.
echo 📊 ESTADO ACTUAL:
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🛑 PASO 1: Deteniendo TODOS los servicios clinic
echo ================================================

echo Deteniendo clinic-frontend-client...
docker stop clinic-frontend-client 2>nul || echo Ya detenido

echo Deteniendo clinic-backend-api...
docker stop clinic-backend-api 2>nul || echo Ya detenido

echo Deteniendo clinic-admin-frontend...
docker stop clinic-admin-frontend 2>nul || echo Ya detenido

echo Deteniendo clinic-admin-system...
docker stop clinic-admin-system 2>nul || echo Ya detenido

echo Deteniendo clinic-admin-mongodb...
docker stop clinic-admin-mongodb 2>nul || echo Ya detenido

echo.
echo 🧹 PASO 2: Limpiando contenedores detenidos
echo ============================================
docker container prune -f

echo.
echo 🔧 PASO 3: Verificando conectividad con DB de producción
echo =======================================================
echo Verificando conexión a 192.168.1.23:60516...
ping -n 1 192.168.1.23 >nul && echo ✅ IP accesible || echo ❌ IP no accesible

echo.
echo 📝 PASO 4: Configurando variables de producción
echo ===============================================

cd /d "%~dp0\.."

REM Crear archivo de configuración de producción
echo Creando .env de producción...
cd clinic-admin-backend

echo # Configuración de Producción > .env.prod
echo # Base de datos externa >> .env.prod
echo MONGODB_URL=mongodb://root:servermuenpampa2025A!@192.168.1.23:60516/clinic_admin?authSource=admin >> .env.prod
echo. >> .env.prod
echo # Configuración de servidor >> .env.prod
echo ADMIN_USERNAME=admin >> .env.prod
echo ADMIN_PASSWORD=admin123 >> .env.prod
echo JWT_SECRET_KEY=clinic-production-jwt-key-2024-secure >> .env.prod
echo. >> .env.prod
echo # API Keys de producción >> .env.prod
echo API_KEY_DEV=test123456 >> .env.prod
echo API_KEY_PROD=pampaserver2025enservermuA! >> .env.prod
echo. >> .env.prod
echo # URLs de producción >> .env.prod
echo CORS_ORIGINS=["http://pampaservers.com:60519","http://pampaservers.com:60521","http://pampaservers.com:60523","http://localhost:60519","http://localhost:60521","http://localhost:60523"] >> .env.prod
echo ALLOWED_ORIGINS=http://pampaservers.com:60519,http://pampaservers.com:60521,http://pampaservers.com:60523,http://localhost:60519,http://localhost:60521,http://localhost:60523 >> .env.prod
echo. >> .env.prod
echo # Environment >> .env.prod
echo ENVIRONMENT=production >> .env.prod
echo DEBUG=false >> .env.prod
echo HOST=0.0.0.0 >> .env.prod
echo PORT=8000 >> .env.prod

echo ✅ Configuración de producción creada

echo.
echo 🔧 PASO 5: Actualizando docker-compose para producción
echo ======================================================

REM Crear docker-compose específico para producción
echo Creando docker-compose.production.yml...

echo # Docker Compose para Producción > docker-compose.production.yml
echo. >> docker-compose.production.yml
echo services: >> docker-compose.production.yml
echo   # Admin Backend + Frontend >> docker-compose.production.yml
echo   admin-system: >> docker-compose.production.yml
echo     build: >> docker-compose.production.yml
echo       context: . >> docker-compose.production.yml
echo       dockerfile: Dockerfile.admin >> docker-compose.production.yml
echo     container_name: clinic-admin-system >> docker-compose.production.yml
echo     restart: unless-stopped >> docker-compose.production.yml
echo     ports: >> docker-compose.production.yml
echo       - "60519:8000" >> docker-compose.production.yml
echo     environment: >> docker-compose.production.yml
echo       # Base de datos externa >> docker-compose.production.yml
echo       MONGODB_URL: mongodb://root:servermuenpampa2025A!@192.168.1.23:60516/clinic_admin?authSource=admin >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo       # Admin Configuration >> docker-compose.production.yml
echo       ADMIN_USERNAME: admin >> docker-compose.production.yml
echo       ADMIN_PASSWORD: admin123 >> docker-compose.production.yml
echo       JWT_SECRET_KEY: clinic-production-jwt-key-2024-secure >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo       # API Configuration >> docker-compose.production.yml
echo       API_KEY_DEV: test123456 >> docker-compose.production.yml
echo       API_KEY_PROD: pampaserver2025enservermuA! >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo       # CORS >> docker-compose.production.yml
echo       ALLOWED_ORIGINS: "http://pampaservers.com:60519,http://pampaservers.com:60521,http://pampaservers.com:60523,http://localhost:60519,http://localhost:60521,http://localhost:60523" >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo       # Environment >> docker-compose.production.yml
echo       ENVIRONMENT: production >> docker-compose.production.yml
echo       DEBUG: false >> docker-compose.production.yml
echo       HOST: 0.0.0.0 >> docker-compose.production.yml
echo       PORT: 8000 >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo     volumes: >> docker-compose.production.yml
echo       - admin_uploads:/app/uploads >> docker-compose.production.yml
echo     networks: >> docker-compose.production.yml
echo       - admin-network >> docker-compose.production.yml
echo     healthcheck: >> docker-compose.production.yml
echo       test: ["CMD", "curl", "-f", "http://localhost:8000/health"] >> docker-compose.production.yml
echo       interval: 30s >> docker-compose.production.yml
echo       timeout: 10s >> docker-compose.production.yml
echo       retries: 3 >> docker-compose.production.yml
echo       start_period: 60s >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo volumes: >> docker-compose.production.yml
echo   admin_uploads: >> docker-compose.production.yml
echo     driver: local >> docker-compose.production.yml
echo. >> docker-compose.production.yml
echo networks: >> docker-compose.production.yml
echo   admin-network: >> docker-compose.production.yml
echo     driver: bridge >> docker-compose.production.yml

echo ✅ docker-compose.production.yml creado

echo.
echo 🚀 PASO 6: Iniciando Admin System con configuración de producción
echo ==================================================================
docker-compose -f docker-compose.production.yml up -d

echo.
echo ⏳ Esperando que el sistema esté listo...
ping -n 16 127.0.0.1 >nul

echo.
echo 🚀 PASO 7: Iniciando Frontend Client con configuración de producción
echo =====================================================================
cd /d "%~dp0\.."

REM Actualizar docker-compose.yml principal para producción
echo Actualizando configuración de frontend client...

echo # Docker Compose Cliente - Producción > docker-compose.client-prod.yml
echo. >> docker-compose.client-prod.yml
echo services: >> docker-compose.client-prod.yml
echo   frontend-client: >> docker-compose.client-prod.yml
echo     build: >> docker-compose.client-prod.yml
echo       context: . >> docker-compose.client-prod.yml
echo       dockerfile: Dockerfile >> docker-compose.client-prod.yml
echo     container_name: clinic-frontend-client >> docker-compose.client-prod.yml
echo     ports: >> docker-compose.client-prod.yml
echo       - "60521:80" >> docker-compose.client-prod.yml
echo     environment: >> docker-compose.client-prod.yml
echo       - NODE_ENV=production >> docker-compose.client-prod.yml
echo       - VITE_API_URL=http://pampaservers.com:60519 >> docker-compose.client-prod.yml
echo     networks: >> docker-compose.client-prod.yml
echo       - clinic-network >> docker-compose.client-prod.yml
echo     restart: unless-stopped >> docker-compose.client-prod.yml
echo     healthcheck: >> docker-compose.client-prod.yml
echo       test: ["CMD", "curl", "-f", "http://localhost/"] >> docker-compose.client-prod.yml
echo       interval: 30s >> docker-compose.client-prod.yml
echo       timeout: 10s >> docker-compose.client-prod.yml
echo       retries: 3 >> docker-compose.client-prod.yml
echo. >> docker-compose.client-prod.yml
echo networks: >> docker-compose.client-prod.yml
echo   clinic-network: >> docker-compose.client-prod.yml
echo     driver: bridge >> docker-compose.client-prod.yml

docker-compose -f docker-compose.client-prod.yml up -d

echo.
echo ⏳ Esperando que frontend client esté listo...
ping -n 11 127.0.0.1 >nul

echo.
echo 📊 PASO 8: Verificando estado final
echo ===================================

echo === CONTENEDORES ACTIVOS ===
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo === HEALTH CHECKS ===
echo Verificando Admin System (60519)...
curl -f http://localhost:60519/health 2>nul && echo ✅ Admin System OK || echo ❌ Admin System Error

echo Verificando Frontend Client (60521)...
curl -f http://localhost:60521 2>nul && echo ✅ Frontend Client OK || echo ❌ Frontend Client Error

echo.
echo === CONECTIVIDAD DE PRODUCCIÓN ===
echo Verificando API externa...
curl -f http://pampaservers.com:60519/docs 2>nul && echo ✅ API Externa OK || echo ⚠️ API Externa no accesible desde aquí

echo.
echo ✅ RESTART COMPLETO FINALIZADO
echo ==============================
echo.
echo 🌐 URLs DE PRODUCCIÓN:
echo    🔧 API Backend:       http://pampaservers.com:60519
echo    📚 API Docs:          http://pampaservers.com:60519/docs
echo    🏥 Admin Dashboard:   http://pampaservers.com:60519/admin
echo    👥 Client Dashboard:  http://pampaservers.com:60521
echo.
echo 🔐 Credenciales Admin:
echo    Usuario: admin
echo    Contraseña: admin123
echo.
echo 📋 Para acceder al ApiDocumentationModal:
echo    1. Ir a http://pampaservers.com:60519/admin
echo    2. Login con credenciales admin
echo    3. Tab 'Clínicas' → Botón 'Documentación'
echo.
echo 🗄️ Base de datos:
echo    Host: 192.168.1.23:60516
echo    Usuario: root
echo    Password: servermuenpampa2025A!
echo    Comando: docker exec -it mongodb mongosh -u root -p servermuenpampa2025A! --authenticationDatabase admin
echo.
echo 📁 Archivos creados:
echo    - clinic-admin-backend\.env.prod
echo    - clinic-admin-backend\docker-compose.production.yml
echo    - docker-compose.client-prod.yml
echo.

REM Abrir URLs de producción
echo 🌐 Abriendo URLs de producción...
start "" "http://pampaservers.com:60519/docs"
start "" "http://pampaservers.com:60519/admin"
start "" "http://pampaservers.com:60521"

echo.
echo 🎉 TODOS LOS CAMBIOS DE REESTRUCTURACIÓN APLICADOS
echo ==================================================
echo.
echo ✅ Sistema completamente actualizado con:
echo    - Conexión a DB externa de producción
echo    - URLs de producción configuradas
echo    - API Keys de producción
echo    - CORS actualizado
echo    - Todas las mejoras implementadas
echo.
goto end

:cancel
echo.
echo ❌ Restart cancelado por el usuario
echo.

:end
pause