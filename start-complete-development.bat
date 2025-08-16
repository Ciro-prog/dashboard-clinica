@echo off
REM ===========================================
REM Script COMPLETO - 4 servicios independientes  
REM ===========================================

echo.
echo 🏥 CLINIC SYSTEM - CONFIGURACIÓN COMPLETA
echo ==========================================

cd /d "%~dp0"

echo 📝 CONFIGURACIÓN DE SERVICIOS:
echo.
echo 🔧 BACKEND API (Puerto 8000):
echo    - API del sistema completo
echo    - Base de datos MongoDB
echo    - Endpoints para todas las interfaces
echo.
echo 👥 CLIENTE DASHBOARD (Puerto 8080):
echo    - Interface para clínicas (gestión diaria)
echo    - Pacientes, profesionales, citas
echo    - WhatsApp Business integration
echo.
echo 🎨 ADMIN SISTEMA COMPLETO (Puerto 8081):
echo    - Interface administrativa completa
echo    - Gestión avanzada con tarjetas y tema oscuro  
echo    - Pagos, suscripciones, profesionales
echo.
echo 🔐 ADMIN GESTIÓN EMPRESAS (Puerto 8082):
echo    - Interface específica para empresas 
echo    - CREAR/ELIMINAR clínicas con confirmación
echo    - Buscador de empresas
echo    - Gestión de suscripciones básica
echo.

choice /c YN /m "¿Iniciar todos los servicios automáticamente?"

if errorlevel 2 goto manual
if errorlevel 1 goto auto

:auto
echo 🚀 Iniciando servicios...

REM 1. Backend API (Puerto 8000)
start "Backend API" cmd /k "cd clinic-admin-backend && echo 🔧 BACKEND API (8000) INICIANDO... && python main.py"

REM Esperar backend
timeout /t 4 /nobreak >nul

REM 2. Cliente Dashboard (Puerto 8080)  
start "Cliente Dashboard" cmd /k "echo 👥 CLIENTE DASHBOARD (8080) INICIANDO... && npm run dev"

REM Esperar cliente
timeout /t 3 /nobreak >nul

REM 3. Admin Sistema Completo (Puerto 8081)
start "Admin Sistema Completo" cmd /k "cd clinic-admin-backend\frontend-admin && echo 🎨 ADMIN COMPLETO (8081) INICIANDO... && npm install && npm run dev"

REM Esperar admin completo
timeout /t 3 /nobreak >nul

REM 4. Admin Gestión Empresas (Puerto 8082)
start "Admin Gestión Empresas" cmd /k "cd clinic-admin-backend\frontend && echo 🔐 ADMIN EMPRESAS (8082) INICIANDO... && npm install && npm run dev"

REM Esperar un momento y abrir navegadores
timeout /t 10 /nobreak >nul

echo 🌐 Abriendo interfaces principales...
start http://localhost:8080
timeout /t 2 /nobreak >nul
start http://localhost:8081
timeout /t 2 /nobreak >nul
start http://localhost:8082

echo.
echo ✅ DESARROLLO COMPLETO INICIADO!
echo.
echo 🌐 URLs disponibles:
echo    👥 Cliente Dashboard:       http://localhost:8080
echo    🎨 Admin Sistema Completo:  http://localhost:8081  
echo    🔐 Admin Gestión Empresas:  http://localhost:8082 ⭐ (EL QUE BUSCABAS)
echo    🔧 API Backend:             http://localhost:8000
echo    📚 API Docs:                http://localhost:8000/docs
echo.
echo ⭐ IMPORTANTE: 
echo    - Puerto 8082 es el admin específico para crear/eliminar empresas
echo    - Tiene buscador y confirmaciones de eliminación
echo    - Es más básico pero más directo para gestión de empresas
echo.

goto end

:manual
echo.
echo 📋 PASOS MANUALES:
echo.
echo Terminal 1 (Backend API):
echo   cd clinic-admin-backend
echo   python main.py
echo.
echo Terminal 2 (Cliente Dashboard):  
echo   npm run dev
echo.
echo Terminal 3 (Admin Sistema Completo):
echo   cd clinic-admin-backend\frontend-admin
echo   npm install
echo   npm run dev
echo.
echo Terminal 4 (Admin Gestión Empresas):
echo   cd clinic-admin-backend\frontend
echo   npm install
echo   npm run dev
echo.
echo URLs:
echo   👥 Cliente:           http://localhost:8080
echo   🎨 Admin Completo:    http://localhost:8081
echo   🔐 Admin Empresas:    http://localhost:8082 ⭐
echo   🔧 API:               http://localhost:8000
echo.

:end
echo ⚠️  Para detener: Ctrl+C en cada terminal
echo 💡 El admin que buscabas está en el puerto 8082
pause