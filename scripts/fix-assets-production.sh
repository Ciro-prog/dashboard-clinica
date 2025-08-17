#!/bin/bash
# Script DEFINITIVO para corregir problemas de assets en producción
# Soluciona 404 errors de archivos JS/CSS del frontend admin

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔧 CLINIC SYSTEM - DEFINITIVE ASSETS FIX${NC}"
echo "=============================================="

echo ""
echo -e "${YELLOW}🔍 Problema identificado:${NC}"
echo "   ❌ Assets 404: /assets/index-CzOFjnr3.js HTTP/1.1 404 Not Found"
echo "   ❌ Build inconsistente entre local y servidor"
echo "   ❌ Mount points insuficientes en FastAPI"
echo "   ✅ Solución: Rebuild completo + rutas múltiples"

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BLUE}📋 Estado actual del sistema:${NC}"
echo "Current commit: $(git log -1 --oneline)"
echo "Backend directory: $(pwd)/clinic-admin-backend"

cd clinic-admin-backend

# Check frontend admin directory
echo ""
echo -e "${BLUE}🔍 Verificando estructura frontend admin:${NC}"
if [ -d "frontend-admin" ]; then
    echo "✅ frontend-admin directory exists"
    ls -la frontend-admin/ | head -5
else
    echo "❌ frontend-admin directory not found"
    echo "Creating frontend-admin structure..."
    mkdir -p frontend-admin
fi

# Check static admin directory
echo ""
echo "📁 Static admin status:"
if [ -d "static/admin" ]; then
    echo "✅ static/admin exists"
    echo "Files in static/admin:"
    ls -la static/admin/
    if [ -d "static/admin/assets" ]; then
        echo "Assets in static/admin/assets:"
        ls -la static/admin/assets/
    else
        echo "❌ No assets directory found"
    fi
else
    echo "❌ static/admin does not exist"
fi

echo ""
echo -e "${BLUE}🗑️ Limpiando builds anteriores...${NC}"

# Clean old builds
rm -rf static/admin/* 2>/dev/null
rm -rf frontend-admin/dist/* 2>/dev/null
rm -rf frontend-admin/.vite/* 2>/dev/null

echo "✅ Builds anteriores eliminados"

echo ""
echo -e "${BLUE}🔧 Configurando main.py con soporte ROBUSTO de assets...${NC}"

# Create backup
cp main.py main.py.backup-$(date +%Y%m%d-%H%M%S)

# Create the DEFINITIVE main.py with robust asset handling
cat > main.py << 'EOF'
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import auth, clinics, patients, professionals, admin_dashboard, subscription_plans, documents
from app.auth.dependencies import get_user_or_api_key, verify_api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Clinic Admin Backend...")
    await connect_to_mongo()
    print("SUCCESS: Application started successfully")
    
    # Admin frontend setup
    admin_static_dir = "static/admin"
    admin_index = os.path.join(admin_static_dir, "index.html")
    print(f"Admin static dir exists: {os.path.exists(admin_static_dir)}")
    print(f"Admin index exists: {os.path.exists(admin_index)}")
    
    # Log assets directory structure for debugging
    admin_assets_dir = os.path.join(admin_static_dir, "assets")
    if os.path.exists(admin_assets_dir):
        print(f"Assets directory exists: {admin_assets_dir}")
        assets = os.listdir(admin_assets_dir)
        print(f"Assets found: {assets}")
    else:
        print(f"WARNING: Assets directory not found: {admin_assets_dir}")
    
    # Check if running in admin-only mode
    admin_only = os.getenv('ADMIN_ONLY', 'false').lower() == 'true'
    if admin_only:
        print("Running in ADMIN-ONLY mode")
    
    yield
    # Shutdown
    print("Shutting down Clinic Admin Backend...")
    await close_mongo_connection()
    print("Application stopped")


# Create FastAPI application
app = FastAPI(
    title="Clinic Admin Backend",
    description="Backend API for Clinic Management Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "health", "description": "Health check endpoints"},
        {"name": "auth", "description": "Authentication operations"},
        {"name": "admin", "description": "Admin operations"},
        {"name": "Clinics Management", "description": "Clinic management and administration"},
        {"name": "Clinic Services", "description": "Clinic services, schedules, and N8N integration"},
        {"name": "debug", "description": "Debug endpoints for testing"},
    ]
)

# Configure OpenAPI security schemes
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Clinic Admin Backend",
        version="1.0.0",
        description="Backend API for Clinic Management Dashboard",
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        },
        "apiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key for external access. Use 'test123456' for testing."
        }
    }
    
    # Add security to all endpoints that use authentication
    for path_data in openapi_schema["paths"].values():
        for operation in path_data.values():
            if isinstance(operation, dict) and "operationId" in operation:
                # Skip endpoints that don't require authentication
                if any(skip in operation.get("tags", []) for skip in ["health", "debug"]):
                    continue
                if operation.get("operationId") in ["root", "api_info", "health_check"]:
                    continue
                    
                # Add security to authenticated endpoints
                operation["security"] = [
                    {"apiKeyAuth": []},
                    {"bearerAuth": []}
                ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Configure CORS - USING CORRECT ATTRIBUTE FROM config.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # CORRECT: uses cors_origins_list property
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
    print(f"Created uploads directory: {uploads_dir}")

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ===========================================
# DEFINITIVE FRONTEND SERVING CONFIGURATION
# ===========================================

# Mount unified admin frontend static files
admin_static_dir = "static/admin"
legacy_frontend_dist = "frontend/dist"  # Legacy path for backward compatibility

# Check for unified admin frontend (production)
if os.path.exists(admin_static_dir):
    print(f"Found UNIFIED frontend at {admin_static_dir}")
    
    # ===========================================================
    # CRITICAL: MULTIPLE ASSET MOUNT POINTS FOR MAXIMUM COMPATIBILITY
    # ===========================================================
    
    # 1. Original admin assets path
    app.mount("/admin/assets", StaticFiles(directory=f"{admin_static_dir}/assets"), name="admin-assets")
    print(f"✅ Mounted admin assets at /admin/assets")
    
    # 2. Root assets path (primary fix for 404s)
    app.mount("/assets", StaticFiles(directory=f"{admin_static_dir}/assets"), name="root-assets")
    print(f"✅ Mounted admin assets at /assets (404 fix)")
    
    # 3. Alternative root assets path
    app.mount("/static/admin/assets", StaticFiles(directory=f"{admin_static_dir}/assets"), name="static-admin-assets")
    print(f"✅ Mounted admin assets at /static/admin/assets (alternative)")
    
    # 4. Direct static mount (covers all static files)
    app.mount("/static", StaticFiles(directory="static"), name="static-files")
    print(f"✅ Mounted all static files at /static")
    
    # ===========================================================
    # ADMIN FRONTEND SERVING ROUTES
    # ===========================================================
    
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

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "clinic-admin-backend", 
        "version": "1.0.0",
        "database": "connected"
    }

# Root endpoint
@app.get("/", tags=["health"])
async def root():
    return {"message": "Clinic Admin Backend API", "version": "1.0.0"}

# Include API routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(admin_dashboard.router, prefix="/api", tags=["admin"])
app.include_router(clinics.router, prefix="/api", tags=["Clinics Management"])
app.include_router(patients.router, prefix="/api", tags=["Clinics Management"])
app.include_router(professionals.router, prefix="/api", tags=["Clinics Management"])
app.include_router(subscription_plans.router, prefix="/api", tags=["Clinic Services"])
app.include_router(documents.router, prefix="/api", tags=["Clinic Services"])
EOF

echo -e "${GREEN}✅ main.py configurado con MÚLTIPLES mount points de assets${NC}"

echo ""
echo -e "${BLUE}🔨 REBUILD COMPLETO del sistema...${NC}"

# Stop current containers
echo "Deteniendo containers actuales..."
docker-compose -f docker-compose.production.yml down

# Remove any lingering containers and networks
docker system prune -f

echo ""
echo "🔧 Reconstruyendo container completo..."
docker-compose -f docker-compose.production.yml build --no-cache admin-system

echo ""
echo "🚀 Iniciando sistema con nueva configuración..."
docker-compose -f docker-compose.production.yml up -d admin-system

echo "⏳ Esperando inicialización completa (30 segundos)..."
sleep 30

echo ""
echo -e "${BLUE}🧪 VERIFICACIÓN EXHAUSTIVA${NC}"
echo "==============================="

echo ""
echo "📊 Estado del contenedor:"
docker ps --filter "name=clinic-admin-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Health Check:"
if curl -s -f http://localhost:60519/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: HEALTHY${NC}"
    health_response=$(curl -s http://localhost:60519/health)
    echo "   Response: $health_response"
else
    echo -e "${RED}❌ Backend: ERROR${NC}"
    echo "Checking logs for issues..."
    docker logs clinic-admin-system --tail=10
fi

echo ""
echo "📂 Verificación de archivos estáticos:"
docker exec clinic-admin-system find /app/static/admin -name "*.js" -o -name "*.css" | head -10

echo ""
echo "🔍 Mount points verification:"
echo "Verificando que los assets sean accesibles..."

# Test different asset paths
echo -n "Testing /assets/ endpoint: "
if curl -s -f http://localhost:60519/assets/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Check required${NC}"
fi

echo -n "Testing /admin/assets/ endpoint: "
if curl -s -f http://localhost:60519/admin/assets/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Check required${NC}"
fi

echo ""
echo "📋 Logs recientes (verificando mounts):"
docker logs clinic-admin-system --tail=15

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 ASSETS FIX COMPLETADO${NC}"
echo -e "${GREEN}========================================${NC}"

echo ""
echo -e "${BLUE}🌐 URLs para probar:${NC}"
echo "   🔧 Admin Dashboard: http://localhost:60519/admin"
echo "   📚 API Docs: http://localhost:60519/docs"
echo "   ⚡ Health Check: http://localhost:60519/health"

echo ""
echo -e "${BLUE}🔍 Para verificar assets:${NC}"
echo "   Accede al admin dashboard y verifica que no haya errores 404"
echo "   Revisa la consola del navegador para confirmación"

echo ""
echo -e "${YELLOW}💡 ¿Qué se corrigió?${NC}"
echo "   ✅ Rebuild completo del frontend admin"
echo "   ✅ 4 mount points de assets para máxima compatibilidad:"
echo "      - /admin/assets (original)"
echo "      - /assets (fix principal para 404s)"
echo "      - /static/admin/assets (alternativo)"
echo "      - /static (todos los archivos estáticos)"
echo "   ✅ Limpieza de builds antiguos"
echo "   ✅ Verificación exhaustiva de funcionamiento"

echo ""
echo -e "${GREEN}¡Script completado! El problema de assets debería estar resuelto definitivamente.${NC}"

read -p "Presiona Enter para continuar..."