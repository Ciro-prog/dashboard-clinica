#!/bin/bash
# Script para corregir assets 404 con rebuild completo del contenedor

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔧 CLINIC SYSTEM - ADMIN ASSETS FIX (REBUILD)${NC}"
echo "============================================"

echo ""
echo -e "${YELLOW}🔍 Análisis del problema anterior:${NC}"
echo "   ❌ restart no aplica cambios a main.py (código se copia en build)"
echo "   ❌ Mount adicional /assets no se aplicó"
echo "   ❌ Verificación con HEAD requests causa 405 error"
echo ""
echo -e "${GREEN}✅ Solución: Rebuild completo del contenedor${NC}"

echo ""
echo -e "${BLUE}📊 Estado actual:${NC}"
docker ps --filter "name=clinic-admin-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/clinic-admin-backend"

echo ""
echo -e "${BLUE}🔍 Verificando main.py actual en host:${NC}"
if grep -q "root-assets" main.py; then
    echo -e "${GREEN}✅ main.py en host tiene el fix aplicado${NC}"
else
    echo -e "${RED}❌ main.py en host NO tiene el fix - aplicando...${NC}"
    
    # Create backup if not exists
    if [ ! -f main.py.backup-* ]; then
        cp main.py main.py.backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Apply the fix
    cat > main.py << 'EOF'
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import auth, clinics


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Clinic Admin Backend...")
    await connect_to_mongo()
    print("SUCCESS: Application started successfully")

    # Admin frontend setup
    admin_static_dir = "static/admin"
    admin_index = os.path.join(admin_static_dir, "index.html")
    print(f"Admin static dir exists: {os.path.exists(admin_static_dir)}")
    print(f"Admin index exists: {os.path.exists(admin_index)}")

    # Check if running in admin-only mode
    admin_only = os.getenv('ADMIN_ONLY', 'false').lower() == 'true'
    if admin_only:
        print("Running in ADMIN-ONLY mode")

    yield

    await close_mongo_connection()
    print("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Clinic Admin Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "clinic-admin-backend",
        "version": "1.0.0",
        "database": "connected"
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Clinic Admin Backend API", "version": "1.0.0"}

# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    print(f"Created uploads directory: {uploads_dir}")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ===========================================
# UNIFIED FRONTEND SERVING CONFIGURATION
# ===========================================

# Mount unified admin frontend static files
admin_static_dir = "static/admin"
legacy_frontend_dist = "frontend/dist"  # Legacy path for backward compatibility

# Check for unified admin frontend (production)
if os.path.exists(admin_static_dir):
    print(f"Found UNIFIED frontend at {admin_static_dir}")

    # Mount static files for assets (CSS, JS, etc.) - ORIGINAL PATH
    app.mount("/admin/assets", StaticFiles(directory=f"{admin_static_dir}/assets"), name="admin-assets")
    print(f"Mounted admin assets at /admin/assets")

    # FIX: Mount additional path for root assets (solves 404 issue)
    app.mount("/assets", StaticFiles(directory=f"{admin_static_dir}/assets"), name="root-assets")
    print(f"Mounted admin assets at /assets (404 fix)")

    # Serve admin app at root of /admin
    @app.get("/admin")
    async def serve_unified_admin_root():
        """Serve the unified admin frontend application (without trailing slash)"""
        admin_index = os.path.join(admin_static_dir, "index.html")
        if os.path.exists(admin_index):
            return FileResponse(admin_index)
        else:
            raise HTTPException(status_code=404, detail="Unified admin frontend not built")

    @app.get("/admin/")
    async def serve_unified_admin():
        """Serve the unified admin frontend application (with trailing slash)"""
        admin_index = os.path.join(admin_static_dir, "index.html")
        if os.path.exists(admin_index):
            return FileResponse(admin_index)
        else:
            raise HTTPException(status_code=404, detail="Unified admin frontend not built")

    # Catch-all route for React Router (SPA routing) - must be last
    @app.get("/admin/{path:path}")
    async def serve_unified_admin_spa(path: str):
        """Handle React Router SPA routing for admin frontend"""
        # Serve static files if they exist
        static_file_path = os.path.join(admin_static_dir, path)
        if os.path.isfile(static_file_path):
            return FileResponse(static_file_path)

        # For all non-asset routes, serve index.html (SPA routing)
        admin_index = os.path.join(admin_static_dir, "index.html")
        if os.path.exists(admin_index):
            return FileResponse(admin_index)
        else:
            raise HTTPException(status_code=404, detail="Unified admin frontend not found")

# Check for legacy admin frontend (development)
elif os.path.exists(legacy_frontend_dist):
    print(f"Found LEGACY frontend at {legacy_frontend_dist}")
    
    # Mount static files for assets
    app.mount("/assets", StaticFiles(directory=f"{legacy_frontend_dist}/assets"), name="legacy-assets")
    print(f"Mounted legacy assets at /assets")
    
    # Serve legacy admin app
    @app.get("/admin")
    async def serve_legacy_admin():
        """Serve the legacy admin frontend application"""
        legacy_index = os.path.join(legacy_frontend_dist, "index.html")
        if os.path.exists(legacy_index):
            return FileResponse(legacy_index)
        else:
            raise HTTPException(status_code=404, detail="Legacy admin frontend not built. Run 'npm run build' in frontend directory.")

else:
    print(f"WARNING: No admin frontend found!")
    print(f"   Expected: {admin_static_dir} (unified) or {legacy_frontend_dist} (legacy)")
    print(f"   Run build process to create frontend files.")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(clinics.router, prefix="/api")
EOF

    echo -e "${GREEN}✅ main.py actualizado con fix${NC}"
fi

echo ""
echo -e "${BLUE}🔧 REBUILD COMPLETO (requerido para aplicar cambios a main.py)${NC}"

# Stop and remove the current container
echo "Deteniendo contenedor actual..."
docker-compose -f docker-compose.production.yml down

# Rebuild with no cache to ensure changes are applied
echo "Reconstruyendo imagen sin cache..."
docker-compose -f docker-compose.production.yml build --no-cache admin-system

# Start with fresh container
echo "Iniciando contenedor con nueva imagen..."
docker-compose -f docker-compose.production.yml up -d admin-system

echo "Esperando que el servicio inicie completamente..."
sleep 30

echo ""
echo -e "${BLUE}🧪 VERIFICACIÓN COMPLETA (usando GET requests)${NC}"
echo "============================================"

echo "Estado del contenedor:"
docker ps --filter "name=clinic-admin-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECK ==="
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Backend OK${NC}" || echo -e "${RED}❌ Backend Error${NC}"

echo ""
echo "=== ADMIN FRONTEND (GET request) ==="
admin_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/admin 2>/dev/null)
if [ "$admin_status" = "200" ]; then
    echo -e "${GREEN}✅ Admin frontend responde 200${NC}"
else
    echo -e "${RED}❌ Admin frontend error: $admin_status${NC}"
fi

echo ""
echo "=== ASSETS VERIFICATION (GET requests) ==="
echo "Probando CSS asset:"
css_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/assets/index-BAwUZWBE.css 2>/dev/null)
if [ "$css_status" = "200" ]; then
    echo -e "${GREEN}✅ CSS asset disponible: $css_status${NC}"
else
    echo -e "${RED}❌ CSS asset error: $css_status${NC}"
fi

echo "Probando JS asset:"
js_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:60519/assets/index-BoE4VRIg.js 2>/dev/null)
if [ "$js_status" = "200" ]; then
    echo -e "${GREEN}✅ JS asset disponible: $js_status${NC}"
else
    echo -e "${RED}❌ JS asset error: $js_status${NC}"
fi

echo ""
echo "=== VERIFICACIÓN DE MOUNTS EN LOGS ==="
echo "Buscando mensajes de mount en logs de inicio:"
docker logs clinic-admin-system 2>&1 | grep -i "mounted.*assets" || echo "No se encontraron mensajes de mount"

echo ""
echo "=== LOGS RECIENTES ==="
echo "Últimas 10 líneas:"
docker logs clinic-admin-system --tail=10

echo ""
if [ "$admin_status" = "200" ] && [ "$css_status" = "200" ] && [ "$js_status" = "200" ]; then
    echo -e "${GREEN}✅ ¡FIX COMPLETAMENTE EXITOSO!${NC}"
    echo "========================================="
    echo ""
    echo -e "${BLUE}🌐 Admin Dashboard completamente funcional:${NC}"
    echo "   🎯 http://localhost:60519/admin"
    echo ""
    echo -e "${BLUE}🔧 Assets servidos correctamente en:${NC}"
    echo "   📄 /assets/ (fix aplicado)"
    echo "   📄 /admin/assets/ (compatibilidad)"
else
    echo -e "${RED}❌ Algunos problemas persisten${NC}"
    echo "Ver logs arriba para diagnóstico adicional"
fi

echo ""
read -p "Presiona Enter para continuar..."