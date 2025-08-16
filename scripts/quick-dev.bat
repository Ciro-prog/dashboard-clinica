@echo off
REM ===========================================
REM Script rápido para desarrollo (Windows)
REM ===========================================

echo.
echo 🚀 CLINIC DASHBOARD - INICIO RÁPIDO
echo ====================================

cd /d "%~dp0\.."

REM Verificar si existe npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

REM Iniciar desarrollo
echo 🎯 Iniciando modo desarrollo...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:60519
echo.

start "" "http://localhost:3000"
npm run dev