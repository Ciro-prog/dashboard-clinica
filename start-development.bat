@echo off
REM ===========================================
REM Script para desarrollo - Frontend + Backend
REM ===========================================

echo.
echo 🏥 CLINIC ADMIN - DESARROLLO COMPLETO
echo =====================================

cd /d "%~dp0"

echo 📝 INSTRUCCIONES DE DESARROLLO:
echo.
echo 1️⃣ BACKEND (Terminal 1):
echo    cd clinic-admin-backend
echo    python main.py
echo    → http://localhost:8000 (API)
echo.
echo 2️⃣ FRONTEND (Terminal 2):
echo    npm run dev
echo    → http://localhost:8080 (Admin Interface)
echo.
echo 🔗 CONFIGURACIÓN:
echo    - Frontend (Vite): Puerto 8080
echo    - Backend (FastAPI): Puerto 8000  
echo    - Proxy: /api → localhost:8000
echo.

choice /c YN /m "¿Abrir ambos terminales automáticamente?"

if errorlevel 2 goto manual
if errorlevel 1 goto auto

:auto
echo 🚀 Abriendo terminales...

REM Abrir terminal para backend
start "Backend - FastAPI" cmd /k "cd clinic-admin-backend && echo 🔧 BACKEND STARTING... && python main.py"

REM Esperar un momento
timeout /t 3 /nobreak >nul

REM Abrir terminal para frontend  
start "Frontend - Vite" cmd /k "echo 🎨 FRONTEND STARTING... && npm run dev"

REM Esperar un momento y abrir navegador
timeout /t 5 /nobreak >nul
start http://localhost:8080

echo ✅ Desarrollo iniciado!
echo 🌐 Admin: http://localhost:8080
echo 🔧 API: http://localhost:8000
goto end

:manual
echo.
echo 📋 PASOS MANUALES:
echo.
echo Terminal 1 (Backend):
echo   cd clinic-admin-backend
echo   python main.py
echo.
echo Terminal 2 (Frontend):
echo   npm run dev
echo.
echo Luego ir a: http://localhost:8080
echo.

:end
pause