@echo off
REM Script para desarrollar SOLO el admin (puerto 5173)

echo.
echo ========================================
echo  ADMIN FRONTEND - DESARROLLO
echo ========================================
echo.

echo ✅ Puerto: 5173
echo ✅ Backend: pampaservers.com:60519
echo.

REM Verificar backend
curl -f http://pampaservers.com:60519/health 2>nul && (
    echo ✅ Backend OK
) || (
    echo ⚠️ Backend no responde
)

echo.
cd clinic-admin-backend\frontend-admin

echo 📦 Instalando dependencias...
npm install

echo.
echo 🔧 Iniciando Admin Frontend...
echo.
echo URLs:
echo   🔧 Admin: http://localhost:5173
echo   🔗 Backend: http://pampaservers.com:60519/admin
echo.
npm run dev