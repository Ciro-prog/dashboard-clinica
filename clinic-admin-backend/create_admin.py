#!/usr/bin/env python3
"""
Script para crear usuario admin inicial
"""

import asyncio
from datetime import datetime
from app.core.database import connect_to_mongo, get_collection, close_mongo_connection
from app.auth.security import get_password_hash

async def create_initial_admin():
    """Crear admin inicial"""
    print("Conectando a MongoDB...")
    await connect_to_mongo()
    
    admins_collection = await get_collection("admins")
    
    # Verificar si ya existe un admin
    existing_admin = await admins_collection.find_one({"username": "admin"})
    if existing_admin:
        print("[OK] Ya existe un admin con username 'admin'")
        return
    
    # Crear admin inicial
    admin_data = {
        "username": "admin",
        "email": "admin@admin.com",
        "full_name": "Super Admin",
        "password_hash": get_password_hash("admin123"),
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    result = await admins_collection.insert_one(admin_data)
    print(f"[OK] Admin creado exitosamente con ID: {result.inserted_id}")
    print("Credenciales:")
    print("  Username: admin")
    print("  Password: admin123")
    print("  Email: admin@admin.com")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_initial_admin())