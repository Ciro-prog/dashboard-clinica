#!/usr/bin/env python3
"""
Script para agregar campos faltantes a la clínica de Ciro
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def fix_clinic_fields():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["clinica-dashboard"]
    clinics = db["clinics"]
    
    email = "admin@clinicadeciro.com"
    
    print(f"Agregando campos faltantes para {email}...")
    
    # Campos requeridos por el endpoint de login
    missing_fields = {
        "subscription_status": "active",
        "subscription_plan": "premium",
        "cell_phone": "+54 11 1234-5678",
        "address": "Dirección de la clínica",
        "domain_name": "clinica-ciro",
        "subscription_expires": datetime.utcnow() + timedelta(days=365),
        "max_professionals": 10,
        "max_patients": 100,
        "whatsapp_session_name": "clinica-ciro-session",
        "updated_at": datetime.utcnow()
    }
    
    # Actualizar la clínica
    result = await clinics.update_one(
        {"email": email},
        {"$set": missing_fields}
    )
    
    if result.modified_count > 0:
        print("SUCCESS - Campos agregados exitosamente")
        
        # Verificar la clínica actualizada
        clinic = await clinics.find_one({"email": email})
        if clinic:
            print(f"Clínica: {clinic['name_clinic']}")
            print(f"ID: {clinic['clinic_id']}")
            print(f"Status: {clinic.get('status_clinic', 'active')}")
            print(f"Subscription: {clinic['subscription_status']}")
            print(f"Plan: {clinic['subscription_plan']}")
            
    else:
        print("ERROR - No se pudieron agregar los campos")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_clinic_fields())