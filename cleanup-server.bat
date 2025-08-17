@echo off
REM Script para limpiar archivos innecesarios del servidor
REM Mantiene solo los archivos esenciales para funcionamiento

echo.
echo ========================================
echo  LIMPIEZA DE ARCHIVOS INNECESARIOS
echo ========================================
echo.

echo Eliminando scripts de desarrollo y troubleshooting innecesarios...

REM Ir al directorio de scripts
cd scripts

REM Mantener solo los scripts esenciales
echo Eliminando scripts obsoletos...

del /q check-admin-frontend.sh 2>nul
del /q check-logs.sh 2>nul
del /q deploy-server.sh 2>nul
del /q deploy-windows.ps1 2>nul
del /q diagnose-restart-loops.sh 2>nul
del /q docker-start.sh 2>nul
del /q docker-stop.sh 2>nul
del /q fix-admin-assets-rebuild.sh 2>nul
del /q fix-admin-assets.sh 2>nul
del /q fix-build-issues.sh 2>nul
del /q fix-database-credentials.sh 2>nul
del /q get-container-logs.sh 2>nul
del /q make-executable.sh 2>nul
del /q production-complete-restart.bat 2>nul
del /q production-complete-restart.sh 2>nul
del /q production-port-migration.bat 2>nul
del /q quick-dev.bat 2>nul
del /q quick-prod.bat 2>nul
del /q quick-production-check.bat 2>nul
del /q quick-production-check.sh 2>nul
del /q start-client.bat 2>nul

REM Mantener scripts de Linux para producción
echo ✅ Manteniendo scripts de Linux para servidor:
echo   - production-deploy.sh
echo   - production-update.sh  
echo   - production-monitor.sh
echo   - fix-cors-and-rebuild.sh

echo.
echo ✅ Scripts innecesarios eliminados

echo.
echo ========================================
echo  ARCHIVOS MANTENIDOS PARA PRODUCCION
echo ========================================
echo.

echo 📁 CORE DEL SISTEMA:
echo   - clinic-admin-backend/ (backend + frontend)
echo   - DEPLOYMENT.md (documentación de deploy)
echo   - CLAUDE.md (documentación técnica)
echo.

echo 🔧 SCRIPTS ESENCIALES:
echo   - scripts/fix-cors-and-rebuild.sh (corrección de problemas)
echo.

echo 💻 DESARROLLO LOCAL:
echo   - start-local-dev.bat (iniciar desarrollo local)
echo   - stop-local-dev.bat (detener desarrollo local)
echo.

echo ========================================
echo  LIMPIEZA COMPLETADA
echo ========================================
echo.
echo El servidor ahora contiene solo los archivos
echo estrictamente necesarios para funcionamiento
echo y documentación.
echo.

pause