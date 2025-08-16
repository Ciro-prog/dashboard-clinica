@echo off
REM Script rápido para verificar estado de producción

echo.
echo 🔍 CLINIC SYSTEM - PRODUCTION STATUS CHECK
echo ==========================================

echo.
echo 📊 CONTENEDORES ACTIVOS:
docker ps --filter "name=clinic" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 💚 HEALTH CHECKS LOCALES:
echo Backend Admin (60519)...
curl -f http://localhost:60519/health 2>nul && echo ✅ OK || echo ❌ Error

echo Frontend Client (60521)...  
curl -f http://localhost:60521 2>nul && echo ✅ OK || echo ❌ Error

echo.
echo 🌐 CONECTIVIDAD EXTERNA:
echo API Docs (pampaservers.com:60519)...
curl -f http://pampaservers.com:60519/docs 2>nul && echo ✅ Accesible || echo ⚠️ No accesible desde aquí

echo.
echo 🗄️ BASE DE DATOS EXTERNA:
echo Verificando ping a 192.168.1.23...
ping -n 1 192.168.1.23 >nul && echo ✅ IP accesible || echo ❌ IP no accesible

echo.
echo 📋 URLs IMPORTANTES:
echo    🔧 API: http://pampaservers.com:60519
echo    📚 Docs: http://pampaservers.com:60519/docs  
echo    🏥 Admin: http://pampaservers.com:60519/admin
echo    👥 Client: http://pampaservers.com:60521
echo.
echo 🔑 DB Command:
echo    docker exec -it mongodb mongosh -u root -p servermuenpampa2025A! --authenticationDatabase admin
echo.
pause