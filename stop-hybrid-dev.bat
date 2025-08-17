@echo off
REM Script para detener desarrollo híbrido

echo.
echo ========================================
echo  DETENIENDO DESARROLLO HÍBRIDO
echo ========================================
echo.

echo 🛑 Deteniendo backend Docker...
cd clinic-admin-backend
docker-compose -f docker-compose.local.yml down

echo.
echo ✅ Sistema híbrido detenido
echo.
echo 📝 Nota: Frontend se detiene con Ctrl+C en su ventana
echo.
pause