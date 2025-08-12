#!/usr/bin/env python3
"""
Script para actualizar la contraseña de una clínica específica
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_clinic_password():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["clinica-dashboard"]
    clinics = db["clinics"]
    
    email = "admin@clinicadeciro.com"
    new_password = "admin123"
    
    print(f"Actualizando contraseña para {email}...")
    
    # Generar hash de la nueva contraseña
    new_password_hash = pwd_context.hash(new_password)
    
    # Actualizar la contraseña
    result = await clinics.update_one(
        {"email": email},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    if result.modified_count > 0:
        print("SUCCESS - Contraseña actualizada exitosamente")
        print(f"Email: {email}")
        print(f"Nueva contraseña: {new_password}")
        
        # Verificar la actualización
        clinic = await clinics.find_one({"email": email})
        if clinic:
            print(f"Clínica: {clinic['name_clinic']}")
            print(f"ID: {clinic['clinic_id']}")
        
    else:
        print("ERROR - No se pudo actualizar la contraseña")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_clinic_password())