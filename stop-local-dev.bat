@echo off
REM Script para detener el desarrollo local

echo.
echo ========================================
echo  DETENIENDO DESARROLLO LOCAL
echo ========================================
echo.

cd clinic-admin-backend

echo Deteniendo contenedor local...
docker-compose -f docker-compose.local.yml down

echo.
echo ✅ Sistema local detenido
echo.
pause