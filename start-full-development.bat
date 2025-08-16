@echo off
REM ===========================================
REM Script completo de desarrollo - 3 servicios
REM ===========================================

echo.
echo 🏥 CLINIC SYSTEM - DESARROLLO COMPLETO
echo ======================================

cd /d "%~dp0"

echo 📝 CONFIGURACIÓN COMPLETA:
echo.
echo 🔧 BACKEND (Puerto 8000):
echo    - API del sistema 
echo    - Base de datos MongoDB
echo    - Endpoints para clientes y admin
echo.
echo 👥 CLIENTE DASHBOARD (Puerto 8080):
echo    - Interface para clínicas
echo    - Gestión de pacientes y profesionales  
echo    - WhatsApp Business integration
echo.
echo 🔐 ADMIN SISTEMA (Puerto 8081):
echo    - Interface administrativa
echo    - Gestión de empresas y suscripciones
echo    - Pagos y facturación
echo    - Configuración del sistema
echo.

choice /c YN /m "¿Iniciar todos los servicios automáticamente?"

if errorlevel 2 goto manual
if errorlevel 1 goto auto

:auto
echo 🚀 Iniciando servicios...

REM 1. Backend (Puerto 8000)
start "Backend - FastAPI" cmd /k "cd clinic-admin-backend && echo 🔧 BACKEND (8000) INICIANDO... && python main.py"

REM Esperar backend
timeout /t 4 /nobreak >nul

REM 2. Cliente Dashboard (Puerto 8080)  
start "Cliente Dashboard" cmd /k "echo 👥 CLIENTE DASHBOARD (8080) INICIANDO... && npm run dev"

REM Esperar cliente
timeout /t 3 /nobreak >nul

REM 3. Admin Sistema (Puerto 8081)
start "Admin Sistema" cmd /k "cd clinic-admin-backend\frontend-admin && echo 🔐 ADMIN SISTEMA (8081) INICIANDO... && npm install && npm run dev"

REM Esperar un momento y abrir navegadores
timeout /t 8 /nobreak >nul

echo 🌐 Abriendo interfaces...
start http://localhost:8080
timeout /t 2 /nobreak >nul
start http://localhost:8081

echo.
echo ✅ DESARROLLO COMPLETO INICIADO!
echo.
echo 🌐 URLs disponibles:
echo    👥 Cliente Dashboard: http://localhost:8080
echo    🔐 Admin Sistema:     http://localhost:8081  
echo    🔧 API Backend:       http://localhost:8000
echo    📚 API Docs:          http://localhost:8000/docs
echo.

goto end

:manual
echo.
echo 📋 PASOS MANUALES:
echo.
echo Terminal 1 (Backend):
echo   cd clinic-admin-backend
echo   python main.py
echo.
echo Terminal 2 (Cliente Dashboard):  
echo   npm run dev
echo.
echo Terminal 3 (Admin Sistema):
echo   cd clinic-admin-backend\frontend-admin
echo   npm install
echo   npm run dev
echo.
echo URLs:
echo   👥 Cliente: http://localhost:8080
echo   🔐 Admin:   http://localhost:8081
echo   🔧 API:     http://localhost:8000
echo.

:end
echo ⚠️  Para detener: Ctrl+C en cada terminal
pause