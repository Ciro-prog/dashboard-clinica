@echo off
echo ====================================
echo   ClinicaAdmin - Iniciando Sistema
echo ====================================
echo.

echo Verificando MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MongoDB esta ejecutandose
) else (
    echo ⚠ MongoDB no detectado. Asegurate de que este ejecutandose en localhost:27017
)

echo.
echo Verificando frontend...
if exist "frontend\dist\index.html" (
    echo ✓ Frontend construido correctamente
) else (
    echo ⚠ Frontend no construido. Ejecuta 'npm run build' en la carpeta frontend/
)

echo.
echo ====================================
echo   Iniciando Backend + Frontend
echo ====================================
echo.
echo Backend API: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin
echo API Docs: http://localhost:8000/docs
echo.
echo Credenciales:
echo   Usuario: admin
echo   Password: admin123
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python main.py