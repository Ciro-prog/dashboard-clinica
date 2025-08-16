@echo off
REM ===========================================
REM Script rápido para producción (Windows)
REM ===========================================

echo.
echo 🚀 CLINIC DASHBOARD - DEPLOYMENT PRODUCCIÓN
echo ===========================================

cd /d "%~dp0\.."

REM Verificar dependencias
where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ docker-compose no está instalado
    pause
    exit /b 1
)

REM Ejecutar script de deployment
cd clinic-admin-backend\scripts
bash prod-deploy.sh

echo.
echo ✅ Deployment completado
echo 🌐 Aplicación disponible en: http://localhost:60519/admin
echo.
pause