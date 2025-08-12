@echo off
echo ====================================
echo   ClinicaAdmin - Setup Automatico
echo ====================================
echo.

echo [1/4] Instalando dependencias Python...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: No se pudieron instalar las dependencias Python
    pause
    exit /b 1
)

echo.
echo [2/4] Configurando frontend...
cd frontend
if not exist package.json (
    echo Error: No se encuentra package.json en frontend/
    pause
    exit /b 1
)

echo [3/4] Instalando dependencias Node.js...
npm install
if %errorlevel% neq 0 (
    echo Error: No se pudieron instalar las dependencias Node.js
    pause
    exit /b 1
)

echo.
echo [4/4] Construyendo frontend para produccion...
npm run build
if %errorlevel% neq 0 (
    echo Error: No se pudo construir el frontend
    pause
    exit /b 1
)

cd..

echo.
echo ====================================
echo   INSTALACION COMPLETADA
echo ====================================
echo.
echo Para ejecutar el sistema:
echo   1. Asegurate de que MongoDB este ejecutandose
echo   2. Ejecuta: python main.py
echo   3. Accede a: http://localhost:8000/admin
echo.
echo Credenciales de administrador:
echo   Usuario: admin
echo   Password: admin123
echo.
pause