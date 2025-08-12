#!/usr/bin/env python3
"""
Test server for debugging the admin frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn

# Create FastAPI app
app = FastAPI(title="Test Admin Server", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
frontend_dist = "frontend/dist"
if os.path.exists(frontend_dist):
    app.mount("/admin", StaticFiles(directory=frontend_dist, html=True), name="admin")
    print(f"[OK] Mounted frontend at /admin from {frontend_dist}")
else:
    print(f"[ERROR] Frontend dist not found at {frontend_dist}")

# Test API endpoints
@app.get("/api/admin/test")
async def test_admin():
    return {"message": "Admin API working", "status": "ok"}

@app.get("/api/admin/subscription-plans")
async def get_plans():
    return {
        "trial": {"name": "Trial", "price": 0},
        "basic": {"name": "Basic", "price": 29.99},
        "premium": {"name": "Premium", "price": 59.99}
    }

@app.get("/api/admin/dashboard/stats")
async def get_stats():
    return {
        "total_clinics": 5,
        "active_clinics": 3,
        "trial_clinics": 2,
        "monthly_revenue": 179.94,
        "total_patients": 150,
        "total_professionals": 12,
        "plan_distribution": {"basic": 2, "premium": 1},
        "growth_this_month": 15
    }

@app.get("/api/auth/login")
async def mock_login():
    return {
        "access_token": "test_token",
        "user_type": "admin",
        "user_data": {
            "id": "admin_1",
            "username": "admin",
            "role": "admin",
            "permissions": []
        }
    }

@app.post("/api/auth/login")
async def mock_login_post():
    return {
        "access_token": "test_token",
        "user_type": "admin",
        "user_data": {
            "id": "admin_1",
            "username": "admin",
            "role": "admin", 
            "permissions": []
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Test Admin Server",
        "admin_url": "/admin",
        "api_test": "/api/admin/test"
    }

if __name__ == "__main__":
    print("[STARTING] Test Admin Server...")
    print("[URL] Admin Frontend: http://localhost:8000/admin")
    print("[URL] API Test: http://localhost:8000/api/admin/test")
    
    uvicorn.run(
        "test_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )