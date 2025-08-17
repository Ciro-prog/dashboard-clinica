@echo off
REM Script para iniciar el sistema admin en desarrollo local
REM Utiliza la misma base de datos de producción

echo.
echo ========================================
echo  CLINIC ADMIN - DESARROLLO LOCAL
echo ========================================
echo.

cd clinic-admin-backend

echo Iniciando sistema admin en localhost:8000...
docker-compose -f docker-compose.local.yml up -d

echo.
echo Esperando que el servicio inicie...
timeout /t 15

echo.
echo ========================================
echo  VERIFICACION DEL SISTEMA
echo ========================================

echo Estado del contenedor:
docker ps --filter "name=clinic-admin-local"

echo.
echo Verificando health check:
curl -f http://localhost:8000/health 2>nul && echo ✅ Backend OK || echo ❌ Backend Error

echo.
echo ========================================
echo  URLs DISPONIBLES
echo ========================================
echo.
echo 🔧 Admin Dashboard: http://localhost:8000/admin
echo 📚 API Docs: http://localhost:8000/docs
echo ⚡ Health Check: http://localhost:8000/health
echo.
echo Presiona Enter para continuar...
pause > nul