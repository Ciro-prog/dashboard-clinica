#!/usr/bin/env python3
"""
Script para verificar qué bases de datos contienen datos
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_databases():
    """Verificar contenido de ambas bases de datos"""
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return
    
    # Check both databases
    databases = ["clinica", "clinica-dashboard"]
    
    for db_name in databases:
        print(f"\n=== DATABASE: {db_name} ===")
        db = client[db_name]
        
        # Check collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        if "subscription_plans" in collections:
            plans_collection = db["subscription_plans"]
            plan_count = await plans_collection.count_documents({})
            active_count = await plans_collection.count_documents({"is_active": True})
            print(f"Subscription plans: {plan_count} total, {active_count} active")
            
            # Show first few plans
            cursor = plans_collection.find({}).limit(3)
            async for plan in cursor:
                print(f"  - {plan.get('plan_id', 'NO_ID')}: {plan.get('name', 'NO_NAME')}")
        
        if "clinics" in collections:
            clinics_collection = db["clinics"]
            clinic_count = await clinics_collection.count_documents({})
            active_count = await clinics_collection.count_documents({"status_clinic": "active"})
            print(f"Clinics: {clinic_count} total, {active_count} active")
            
            # Show first few clinics
            cursor = clinics_collection.find({}).limit(3)
            async for clinic in cursor:
                print(f"  - {clinic.get('clinic_id', 'NO_ID')}: {clinic.get('name_clinic', 'NO_NAME')}")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(check_databases())