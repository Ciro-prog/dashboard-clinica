@echo off
REM Script para desarrollar SOLO el cliente (puerto 8080)

echo.
echo ========================================
echo  CLIENTE FRONTEND - DESARROLLO
echo ========================================
echo.

echo ✅ Puerto: 8080
echo ✅ Backend: pampaservers.com:60519
echo.

REM Verificar backend
curl -f http://pampaservers.com:60519/health 2>nul && (
    echo ✅ Backend OK
) || (
    echo ⚠️ Backend no responde
)

echo.
echo 📦 Instalando dependencias...
npm install

echo.
echo 🎯 Iniciando Cliente Frontend...
echo.
echo URLs:
echo   👥 Cliente: http://localhost:8080
echo   🔗 Backend: http://pampaservers.com:60519
echo.
npm run dev