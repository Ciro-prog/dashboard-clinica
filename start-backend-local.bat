@echo off
REM Script para ejecutar el backend localmente sin Docker
REM Utiliza la misma base de datos de producción

echo.
echo ========================================
echo  CLINIC BACKEND - DESARROLLO LOCAL
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "clinic-admin-backend" (
    echo ❌ Error: No se encuentra el directorio clinic-admin-backend
    echo    Ejecuta este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

cd clinic-admin-backend

echo Configurando variables de entorno para desarrollo...
copy .env.development .env

echo.
echo Verificando instalación de Python...
python --version
if errorlevel 1 (
    echo ❌ Error: Python no está instalado o no está en el PATH
    pause
    exit /b 1
)

echo.
echo Instalando dependencias...
pip install -r requirements.txt

echo.
echo ========================================
echo  INICIANDO BACKEND
echo ========================================
echo.

echo 🚀 Iniciando FastAPI backend en http://127.0.0.1:8000
echo.
echo URLs disponibles:
echo   🔧 Admin Dashboard: http://127.0.0.1:8000/admin
echo   📚 API Docs: http://127.0.0.1:8000/docs
echo   ⚡ Health Check: http://127.0.0.1:8000/health
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Ejecutar el servidor con uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload