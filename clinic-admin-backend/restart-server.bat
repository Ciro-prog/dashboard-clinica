@echo off
REM ===========================================
REM Script para reiniciar el servidor con cambios
REM ===========================================

echo.
echo 🔄 REINICIANDO SERVIDOR CON CAMBIOS
echo ===================================

cd /d "%~dp0"

echo 🛑 Terminando procesos Python existentes...
taskkill /f /im python.exe >nul 2>&1

echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo ✅ Verificando archivos estáticos...
if not exist "static\admin\index.html" (
    echo ❌ ERROR: static\admin\index.html no encontrado
    echo 📝 Ejecuta: npm run build desde la raíz del proyecto
    pause
    exit /b 1
)

echo ✅ Archivos estáticos OK
echo 🚀 Iniciando servidor con configuración actualizada...
echo.
echo 🌐 Admin Interface: http://localhost:8000/admin
echo 🔧 API Endpoints:   http://localhost:8000/api
echo 📚 Documentation:   http://localhost:8000/docs
echo.

python main.py

pause