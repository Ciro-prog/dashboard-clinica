@echo off
REM Script para ejecutar el frontend admin localmente

echo.
echo ========================================
echo  CLINIC FRONTEND - DESARROLLO LOCAL
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "clinic-admin-backend\frontend-admin" (
    echo ❌ Error: No se encuentra el directorio frontend-admin
    pause
    exit /b 1
)

cd clinic-admin-backend\frontend-admin

echo Verificando instalación de Node.js...
node --version
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado o no está en el PATH
    pause
    exit /b 1
)

echo.
echo Verificando instalación de npm...
npm --version
if errorlevel 1 (
    echo ❌ Error: npm no está disponible
    pause
    exit /b 1
)

echo.
echo Instalando dependencias del frontend...
npm install

echo.
echo ========================================
echo  INICIANDO FRONTEND ADMIN
echo ========================================
echo.

echo 🚀 Iniciando React frontend en http://localhost:5173
echo.
echo URLs disponibles:
echo   🎯 Frontend Admin: http://localhost:5173
echo   🔗 Conecta al Backend: http://127.0.0.1:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Ejecutar el servidor de desarrollo
npm run dev