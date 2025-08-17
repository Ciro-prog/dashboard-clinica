@echo off
REM Script mejorado para desarrollo dual con mejor manejo de errores

echo.
echo ========================================
echo  CLINIC SYSTEM - DESARROLLO DUAL (FIXED)
echo ========================================
echo.

REM Verificar backend
echo 🧪 Verificando backend...
curl -f http://pampaservers.com:60519/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend OK
) else (
    echo ❌ Backend no responde
    echo    Verificar servidor pampaservers.com:60519
    pause
    exit /b 1
)

echo.
echo ========================================
echo  PASO 1: CLIENTE (Puerto 8080)
echo ========================================

echo 📦 Instalando dependencias del cliente...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error en npm install del cliente
    echo    Intentar: npm cache clean --force
    pause
    exit /b 1
)

echo ✅ Dependencias del cliente instaladas

echo.
echo ========================================
echo  PASO 2: ADMIN (Puerto 5173)
echo ========================================

echo 📦 Instalando dependencias del admin...
cd clinic-admin-backend\frontend-admin
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error en npm install del admin
    echo    Directorio: clinic-admin-backend\frontend-admin
    pause
    exit /b 1
)

echo ✅ Dependencias del admin instaladas
cd ..\..

echo.
echo ========================================
echo  PASO 3: INICIANDO FRONTENDS
echo ========================================

echo 🎯 Iniciando Cliente (Puerto 8080)...
start "Cliente Frontend" cmd /c "npm run dev & pause"

echo 🔧 Iniciando Admin (Puerto 5173)...
cd clinic-admin-backend\frontend-admin
start "Admin Frontend" cmd /c "npm run dev & pause"
cd ..\..

echo.
echo ========================================
echo  DESARROLLO DUAL INICIADO
echo ========================================
echo.
echo URLs:
echo   👥 CLIENTE: http://localhost:8080
echo   🔧 ADMIN:   http://localhost:5173
echo   🔗 BACKEND: http://pampaservers.com:60519
echo.
echo ✅ Si ves dos ventanas de cmd abiertas, el sistema está funcionando
echo ❌ Si alguna ventana se cerró, revisar errores arriba
echo.

pause