@echo off
REM Script para iniciar solo el backend admin (sin Docker)

echo.
echo 🏥 CLINIC ADMIN SYSTEM - STANDALONE
echo ==================================

REM Cambiar al directorio del script  
cd /d "%~dp0\.."

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python no está instalado
    pause
    exit /b 1
)

REM Instalar dependencias si es necesario
if not exist "venv\" (
    echo 📦 Creando entorno virtual...
    python -m venv venv
)

echo 📦 Activando entorno virtual...
call venv\Scripts\activate.bat

echo 📦 Instalando dependencias...
pip install -r requirements.txt

echo 🔧 Compilando frontend admin...
cd frontend-admin
call npm install
call npm run build
cd ..

echo 📁 Copiando frontend compilado...
if exist "static\admin\" rmdir /s /q static\admin
mkdir static\admin
xcopy /E /Y frontend-admin\dist\* static\admin\

echo 🚀 Iniciando Admin System...
echo.
echo ✅ ADMIN SYSTEM INICIADO
echo ========================
echo 🖥️  Admin Dashboard: http://localhost:8000/admin
echo 🔧  Backend API:     http://localhost:8000/api
echo 📚  API Docs:        http://localhost:8000/docs
echo.
echo 🔐 Credenciales Admin:
echo    Usuario: admin
echo    Contraseña: admin123
echo.

REM Iniciar servidor
python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause