@echo off
REM Script para desarrollo dual: Admin + Cliente
REM Ambos frontends apuntando al backend de producción

echo.
echo ========================================
echo  CLINIC SYSTEM - DESARROLLO DUAL
echo ========================================
echo.
echo ✅ Admin Frontend: Puerto 5173
echo ✅ Cliente Frontend: Puerto 8080  
echo ✅ Backend: pampaservers.com:60519
echo.

REM Verificar backend de producción
echo 🧪 Verificando backend de producción...
curl -f http://pampaservers.com:60519/health 2>nul && (
    echo ✅ Backend producción: OK
) || (
    echo ⚠️ Backend producción: No responde
    echo    Verificar servidor en pampaservers.com:60519
)

echo.
echo ========================================
echo  CONFIGURANDO ENTORNOS
echo ========================================

REM Verificar Node.js
echo Verificando Node.js...
node --version || (
    echo ❌ Node.js no está instalado
    pause
    exit /b 1
)

echo Verificando npm...
npm --version || (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependencias del cliente...
npm install

echo.
echo 📦 Instalando dependencias del admin...
cd clinic-admin-backend\frontend-admin
npm install
cd ..\..

echo.
echo ========================================
echo  INICIANDO DESARROLLO DUAL
echo ========================================
echo.

echo 🎯 Iniciando Cliente Frontend (Puerto 8080)...
start "Cliente Frontend" cmd /k "npm run dev"

echo.
echo Esperando que cliente inicie...
timeout /t 5

echo.
echo 🔧 Iniciando Admin Frontend (Puerto 5173)...
cd clinic-admin-backend\frontend-admin
start "Admin Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  DESARROLLO DUAL ACTIVO
echo ========================================
echo.
echo URLs de desarrollo:
echo   👥 CLIENTE: http://localhost:8080
echo   🔧 ADMIN:   http://localhost:5173
echo   🔗 BACKEND: http://pampaservers.com:60519
echo.
echo 📝 Para desarrollo:
echo   1. Cliente: Modifica archivos en src/
echo   2. Admin: Modifica archivos en clinic-admin-backend/frontend-admin/src/
echo   3. Ambos tienen hot-reload automático
echo   4. Ambos conectan al mismo backend de producción
echo.
echo 🛑 Para detener: Cerrar ventanas de cmd o usar Ctrl+C
echo.

pause