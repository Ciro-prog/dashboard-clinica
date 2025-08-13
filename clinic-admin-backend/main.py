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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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

# Mount frontend static files if they exist
frontend_dist = "frontend/dist"
if os.path.exists(frontend_dist):
    app.mount("/admin", StaticFiles(directory=frontend_dist, html=True), name="admin")
    print(f"Mounted frontend at /admin from {frontend_dist}")
else:
    print(f"Warning: Frontend dist directory not found at {frontend_dist}")

# Specific endpoint to serve admin app
@app.get("/admin/")
async def serve_admin():
    """Serve the admin frontend application"""
    from fastapi.responses import FileResponse
    frontend_index = "frontend/dist/index.html"
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    else:
        raise HTTPException(status_code=404, detail="Admin frontend not built. Run 'npm run build' in frontend directory.")

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(clinics.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(professionals.router, prefix="/api")
app.include_router(admin_dashboard.router, prefix="/api")
app.include_router(subscription_plans.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint - No authentication required"""
    return {
        "status": "healthy",
        "service": "clinic-admin-backend",
        "version": "1.0.0",
        "database": "connected"
    }

# Authenticated health check endpoint
@app.get("/api/health-auth", tags=["health"])
async def authenticated_health_check(user: dict = Depends(get_user_or_api_key)):
    """Authenticated health check - Requires Bearer token OR X-API-Key"""
    return {
        "status": "healthy",
        "service": "clinic-admin-backend", 
        "version": "1.0.0",
        "database": "connected",
        "authenticated": True,
        "auth_method": user.get("authenticated_via", "bearer_token"),
        "user_type": user.get("type", "unknown")
    }


# Debug endpoints for testing without auth
@app.get("/debug/all-data")
async def debug_all_data():
    """New debug endpoint to get all data without authentication"""
    try:
        from app.core.database import get_collection
        plans_collection = await get_collection("subscription_plans")
        
        # Get all active plans
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        plans_list = []
        
        async for plan in cursor:
            if "_id" in plan:
                plan["_id"] = str(plan["_id"])
            plans_list.append(plan)
            
        print(f"DEBUG NEW: Found {len(plans_list)} active subscription plans")
        for plan in plans_list:
            print(f"  - {plan.get('plan_id', 'NO_ID')}: {plan.get('name', 'NO_NAME')} (${plan.get('price', 0)})")
            
        # Also get clinics for testing
        clinics_collection = await get_collection("clinics")
        cursor = clinics_collection.find({"status_clinic": "active"}).limit(10)
        clinics_list = []
        
        async for clinic in cursor:
            if "_id" in clinic:
                clinic["_id"] = str(clinic["_id"])
            # Remove sensitive data
            clinic.pop("password_hash", None)
            clinics_list.append(clinic)
        
        print(f"DEBUG NEW: Found {len(clinics_list)} active clinics")
        for clinic in clinics_list:
            print(f"  - {clinic.get('clinic_id', 'NO_ID')}: {clinic.get('name_clinic', 'NO_NAME')}")
        
        return {
            "status": "success", 
            "total_plans": len(plans_list), 
            "plans": plans_list,
            "total_clinics": len(clinics_list),
            "clinics": clinics_list
        }
    except Exception as e:
        print(f"DEBUG NEW ERROR: {e}")
        return {"error": str(e)}


@app.get("/debug/plans", tags=["debug"])
async def debug_plans(api_key_valid: bool = Depends(verify_api_key)):
    """Debug endpoint to test plans with X-API-Key authentication"""
    try:
        from app.core.database import get_collection
        plans_collection = await get_collection("subscription_plans")
        
        # Get all active plans
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        plans = []
        
        async for plan in cursor:
            if "_id" in plan:
                plan["_id"] = str(plan["_id"])
            plans.append(plan)
            
        print(f"DEBUG: Found {len(plans)} active subscription plans")
        for plan in plans:
            print(f"  - {plan.get('plan_id', 'NO_ID')}: {plan.get('name', 'NO_NAME')} (${plan.get('price', 0)})")
            
        # Also get clinics for testing
        clinics_collection = await get_collection("clinics")
        cursor = clinics_collection.find({"status_clinic": "active"}).limit(10)
        clinics = []
        
        async for clinic in cursor:
            if "_id" in clinic:
                clinic["_id"] = str(clinic["_id"])
            # Remove sensitive data
            clinic.pop("password_hash", None)
            clinics.append(clinic)
        
        print(f"DEBUG: Found {len(clinics)} active clinics")
        for clinic in clinics:
            print(f"  - {clinic.get('clinic_id', 'NO_ID')}: {clinic.get('name_clinic', 'NO_NAME')}")
        
        return {
            "status": "success", 
            "total_plans": len(plans), 
            "plans": plans,
            "total_clinics": len(clinics),
            "clinics": clinics
        }
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        return {"error": str(e)}


@app.get("/debug/complete-data")
async def complete_data_endpoint():
    """Serve the complete data from JSON file"""
    import json
    import os
    
    try:
        json_file = "complete_data.json"
        if os.path.exists(json_file):
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        else:
            return {"error": "Complete data file not found"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/test-plans")
async def test_plans_endpoint():
    """New test endpoint to verify database connection"""
    try:
        from app.core.database import get_collection
        plans_collection = await get_collection("subscription_plans")
        
        # Get all active plans
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        plans_list = []
        
        async for plan in cursor:
            if "_id" in plan:
                plan["_id"] = str(plan["_id"])
            plans_list.append(plan)
        
        return {
            "endpoint": "test-plans",
            "database": "clinica-dashboard", 
            "found_plans": len(plans_list),
            "all_plans": plans_list
        }
    except Exception as e:
        return {"endpoint": "test-plans", "error": str(e)}


@app.get("/debug/clinics", tags=["debug"])  
async def debug_clinics(api_key_valid: bool = Depends(verify_api_key)):
    """Debug endpoint to test clinics with X-API-Key authentication"""
    try:
        from app.core.database import get_collection
        clinics_collection = await get_collection("clinics")
        
        # Get active clinics
        cursor = clinics_collection.find({"status_clinic": "active"}).limit(10)
        clinics = []
        
        async for clinic in cursor:
            if "_id" in clinic:
                clinic["_id"] = str(clinic["_id"])
            # Remove sensitive data
            clinic.pop("password_hash", None)
            clinics.append(clinic)
            
        return {"status": "success", "total_clinics": len(clinics), "clinics": clinics}
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/auth-test")
async def debug_auth_test():
    """Debug endpoint to test admin API with authentication"""
    try:
        from fastapi import Depends, Request
        from app.auth.dependencies import get_current_admin
        from app.models.admin import AdminInDB
        
        # Manually test authentication without decorator
        from app.core.database import get_collection
        admins_collection = await get_collection("admins")
        admin = await admins_collection.find_one({"username": "admin"})
        
        if admin:
            return {
                "auth_test": "success",
                "admin_found": True,
                "admin_id": str(admin["_id"]),
                "username": admin["username"],
                "role": admin["role"],
                "is_active": admin.get("is_active", False)
            }
        else:
            return {"auth_test": "failed", "admin_found": False}
            
    except Exception as e:
        return {"error": str(e), "auth_test": "failed"}


@app.get("/api/test-key", tags=["debug"])
async def test_api_key_endpoint(api_key_valid: bool = Depends(verify_api_key)):
    """Test endpoint specifically for X-API-Key authentication"""
    return {
        "message": "X-API-Key authentication successful!",
        "api_key_valid": api_key_valid,
        "endpoint": "/api/test-key",
        "instructions": "This endpoint requires X-API-Key header. Use 'test123456' for testing."
    }


# Removed problematic token test endpoint that was causing server hang


@app.get("/debug/stats-test")
async def debug_stats_test():
    """Debug endpoint to test stats calculation"""
    try:
        from app.core.database import get_collection
        
        clinics_collection = await get_collection("clinics")
        patients_collection = await get_collection("patients")
        professionals_collection = await get_collection("professionals")
        
        # Get clinic stats
        total_clinics = await clinics_collection.count_documents({})
        active_clinics = await clinics_collection.count_documents({"status_clinic": "active"})
        trial_clinics = await clinics_collection.count_documents({"subscription_status": "trial"})
        
        # Get total users
        total_patients = await patients_collection.count_documents({})
        total_professionals = await professionals_collection.count_documents({})
        
        return {
            "stats_test": "success",
            "total_clinics": total_clinics,
            "active_clinics": active_clinics,
            "trial_clinics": trial_clinics,
            "inactive_clinics": total_clinics - active_clinics,
            "total_patients": total_patients,
            "total_professionals": total_professionals,
            "monthly_revenue": 0.0,  # Simplified for debugging
            "plan_distribution": {},
            "growth_this_month": 0
        }
        
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc(), "stats_test": "failed"}


# Temporary endpoints for Streamlit without authentication
@app.get("/temp/admin/dashboard/stats")
async def temp_admin_dashboard_stats():
    """Temporary stats endpoint without authentication for Streamlit testing"""
    try:
        from app.core.database import get_collection
        
        clinics_collection = await get_collection("clinics")
        patients_collection = await get_collection("patients")
        professionals_collection = await get_collection("professionals")
        
        # Get clinic stats
        total_clinics = await clinics_collection.count_documents({})
        active_clinics = await clinics_collection.count_documents({"status_clinic": "active"})
        trial_clinics = await clinics_collection.count_documents({"subscription_status": "trial"})
        expired_clinics = await clinics_collection.count_documents({"subscription_status": "expired"})
        
        # Calculate monthly revenue from active subscriptions
        pipeline = [
            {"$match": {"subscription_status": "active"}},
            {"$group": {
                "_id": "$subscription_plan",
                "count": {"$sum": 1}
            }}
        ]
        
        monthly_revenue = 0.0
        plan_distribution = {}
        
        # Simple price mapping
        plan_prices = {"basic": 29.99, "premium": 59.99, "enterprise": 99.99, "trial": 0}
        
        async for plan_data in clinics_collection.aggregate(pipeline):
            plan_name = plan_data["_id"]
            count = plan_data["count"]
            plan_distribution[plan_name] = count
            
            if plan_name in plan_prices:
                monthly_revenue += plan_prices[plan_name] * count
        
        # Get total users
        total_patients = await patients_collection.count_documents({})
        total_professionals = await professionals_collection.count_documents({})
        
        return {
            "total_clinics": total_clinics,
            "active_clinics": active_clinics,
            "trial_clinics": trial_clinics,
            "expired_clinics": expired_clinics,
            "revenue_monthly": monthly_revenue,
            "total_patients": total_patients,
            "total_professionals": total_professionals,
            "plan_distribution": plan_distribution,
            "growth_this_month": 0
        }
        
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


@app.get("/temp/admin/subscription-plans")
async def temp_admin_subscription_plans():
    """Temporary subscription plans endpoint without authentication"""
    try:
        from app.core.database import get_collection
        plans_collection = await get_collection("subscription_plans")
        
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        
        plans = {}
        async for plan_doc in cursor:
            plan_data = {
                "name": plan_doc["name"],
                "price": plan_doc["price"],
                "duration_days": plan_doc["duration_days"],
                "features": plan_doc["features"],
                "max_professionals": plan_doc["max_professionals"],
                "max_patients": plan_doc["max_patients"]
            }
            plans[plan_doc["plan_id"]] = plan_data
        
        return plans
        
    except Exception as e:
        return {"error": str(e)}


@app.get("/temp/admin/clinics")
async def temp_admin_clinics():
    """Temporary clinics endpoint without authentication"""
    try:
        from app.core.database import get_collection
        clinics_collection = await get_collection("clinics")
        
        cursor = clinics_collection.find({}).sort("created_at", -1)
        clinics = []
        
        async for clinic in cursor:
            clinic_data = {
                "id": str(clinic["_id"]),
                "clinic_id": clinic["clinic_id"],
                "name_clinic": clinic["name_clinic"],
                "suscriber": clinic["suscriber"],
                "email": clinic["email"],
                "cell_phone": clinic["cell_phone"],
                "address": clinic["address"],
                "status_clinic": clinic["status_clinic"],
                "subscription_status": clinic["subscription_status"],
                "subscription_plan": clinic["subscription_plan"],
                "subscription_expires": clinic.get("subscription_expires"),
                "max_professionals": clinic["max_professionals"],
                "max_patients": clinic["max_patients"],
                "created_at": clinic["created_at"].isoformat() if clinic.get("created_at") else None
            }
            clinics.append(clinic_data)
        
        return clinics
        
    except Exception as e:
        return {"error": str(e)}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Clinic Admin Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }

# API Info endpoint
@app.get("/api/info")
async def api_info():
    """API information endpoint"""
    return {
        "name": "Clinic Admin Backend",
        "version": "1.0.0",
        "database": settings.database_name,
        "endpoints": {
            "auth": "/api/auth",
            "clinics": "/api/clinics",
            "patients": "/api/patients",
            "professionals": "/api/professionals",
            "admin": "/api/admin"
        },
        "frontend": "/admin" if os.path.exists("frontend/dist") else None
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"Global exception: {exc}")
    print(f"Traceback: {traceback.format_exc()}")
    
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    
    print(f"Configuration:")
    print(f"   Database: {settings.database_name}")
    print(f"   Host: {settings.api_host}")
    print(f"   Port: {settings.api_port}")
    print(f"   Debug: {settings.debug}")
    print(f"   CORS Origins: {settings.cors_origins_list}")
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info"
    )