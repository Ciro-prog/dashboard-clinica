@echo off
REM Script para desarrollo SOLO del frontend
REM Conecta al backend de producción (no requiere Docker local)

echo.
echo ========================================
echo  CLINIC FRONTEND - DESARROLLO WINDOWS
echo ========================================
echo.
echo ✅ Sin Docker requerido
echo ✅ Backend producción: pampaservers.com:60519
echo ✅ Hot-reload completo
echo.

REM Verificar que estamos en el directorio correcto
if not exist "clinic-admin-backend\frontend-admin" (
    echo ❌ Error: No se encuentra el directorio frontend-admin
    echo    Ejecuta este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

echo 🧪 Verificando backend de producción...
curl -f http://pampaservers.com:60519/health 2>nul && (
    echo ✅ Backend producción: OK
) || (
    echo ⚠️ Backend producción: No responde
    echo    Verificar que el servidor esté funcionando
    echo    URL: http://pampaservers.com:60519/health
)

echo.
echo ========================================
echo  CONFIGURANDO FRONTEND
echo ========================================

cd clinic-admin-backend\frontend-admin

echo.
echo Verificando Node.js...
node --version || (
    echo ❌ Node.js no está instalado
    echo    Descargar desde: https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando npm...
npm --version || (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependencias...
npm install

echo.
echo 🔧 Configurando variables de entorno...
if not exist ".env.development" (
    echo ❌ Archivo .env.development no encontrado
    echo    Verificar configuración
    pause
    exit /b 1
)

echo ✅ Configuración lista

echo.
echo ========================================
echo  INICIANDO DESARROLLO FRONTEND
echo ========================================
echo.
echo 🎯 Frontend: http://localhost:5173
echo 🔗 Conecta a Backend: http://pampaservers.com:60519
echo 📚 API Docs: http://pampaservers.com:60519/docs
echo.
echo 📝 Para desarrollo:
echo   1. Modifica archivos en src/
echo   2. Hot-reload automático
echo   3. API calls van al servidor de producción
echo.
echo 🛑 Presiona Ctrl+C para detener
echo.

REM Ejecutar el servidor de desarrollo
npm run dev