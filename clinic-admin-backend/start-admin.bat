@echo off
REM ===========================================
REM Script para iniciar el Admin Backend Unificado
REM ===========================================

echo.
echo 🏥 CLINIC ADMIN - BACKEND UNIFICADO
echo ===================================

cd /d "%~dp0"

REM Verificar que el frontend está buildeado
if not exist "static\admin\index.html" (
    echo ❌ Frontend no está buildeado
    echo 📦 Ejecutando build...
    cd ..\src
    npm run build
    cd ..\clinic-admin-backend
    mkdir static\admin 2>nul
    xcopy /E /Y ..\dist\* static\admin\
)

echo ✅ Frontend disponible en static\admin\
echo 🚀 Iniciando backend unificado...
echo.
echo 🌐 Admin Interface: http://localhost:8000/admin
echo 🔧 API Endpoints:   http://localhost:8000/api
echo 📚 Documentation:   http://localhost:8000/docs
echo.

python main.py

pause