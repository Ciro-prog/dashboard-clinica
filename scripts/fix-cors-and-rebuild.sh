#!/bin/bash
# Script para corregir el error de CORS y aplicar mount de assets

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🔧 CLINIC SYSTEM - CORS FIX & ASSETS MOUNT${NC}"
echo "==========================================="

echo ""
echo -e "${YELLOW}🔍 Problema identificado:${NC}"
echo "   ❌ Script anterior sobrescribió main.py correcto"
echo "   ❌ Error: 'Settings' object has no attribute 'allowed_origins'"
echo "   ✅ Solución: Usar cors_origins_list (que existe en config.py)"

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/clinic-admin-backend"

echo ""
echo -e "${BLUE}🔧 Corrigiendo main.py con configuración correcta...${NC}"

# Create backup
cp main.py main.py.backup-$(date +%Y%m%d-%H%M%S)

# Create corrected main.py that uses existing config.py attributes
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

echo -e "${GREEN}✅ main.py corregido con CORS y assets mount${NC}"

echo ""
echo -e "${BLUE}🔧 REBUILD con configuración corregida...${NC}"

# Stop and rebuild
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache admin-system
docker-compose -f docker-compose.production.yml up -d admin-system

echo "Esperando inicialización completa..."
sleep 25

echo ""
echo -e "${BLUE}🧪 VERIFICACIÓN FINAL${NC}"
echo "==================="

echo "Estado del contenedor:"
docker ps --filter "name=clinic-admin-system" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== HEALTH CHECK ==="
curl -f http://localhost:60519/health 2>/dev/null && echo -e "${GREEN}✅ Backend OK${NC}" || echo -e "${RED}❌ Backend Error${NC}"

echo ""
echo "=== LOGS (verificando mounts) ==="
docker logs clinic-admin-system --tail=15

echo ""
echo -e "${BLUE}🎯 URLs para probar:${NC}"
echo "   🔧 Admin Dashboard: http://localhost:60519/admin"
echo "   📚 API Docs: http://localhost:60519/docs"
echo ""

read -p "Presiona Enter para continuar..."