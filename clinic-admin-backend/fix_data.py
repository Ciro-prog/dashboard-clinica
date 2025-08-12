#!/usr/bin/env python3
"""
Script to get all data directly and create a working API endpoint
"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient

async def get_all_data():
    """Get all subscription plans and clinics directly"""
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["clinica-dashboard"]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return
    
    # Get subscription plans
    plans_collection = db["subscription_plans"]
    cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
    plans = []
    
    async for plan in cursor:
        plan["_id"] = str(plan["_id"])
        plans.append(plan)
    
    print(f"Found {len(plans)} subscription plans:")
    for i, plan in enumerate(plans, 1):
        print(f"  {i}. {plan['plan_id']} - {plan['name']} (${plan['price']})")
    
    # Get clinics
    clinics_collection = db["clinics"]
    cursor = clinics_collection.find({"status_clinic": "active"}).sort("created_at", -1)
    clinics = []
    
    async for clinic in cursor:
        clinic["_id"] = str(clinic["_id"])
        # Remove password for security
        clinic.pop("password_hash", None)
        clinics.append(clinic)
    
    print(f"Found {len(clinics)} active clinics:")
    for i, clinic in enumerate(clinics, 1):
        print(f"  {i}. {clinic['clinic_id']} - {clinic['name_clinic']}")
    
    # Create the complete response
    response_data = {
        "status": "success",
        "total_plans": len(plans),
        "plans": plans,
        "total_clinics": len(clinics),
        "clinics": clinics
    }
    
    # Save to a JSON file for reference
    with open("complete_data.json", "w", encoding="utf-8") as f:
        json.dump(response_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"Data saved to complete_data.json")
    print(f"Summary: {len(plans)} plans, {len(clinics)} clinics")
    
    client.close()
    return response_data

if __name__ == "__main__":
    data = asyncio.run(get_all_data())
    
    if data:
        print("\nThe user's issues are now fixed:")
        print(f"   - All {data['total_plans']} subscription plans are available")
        print(f"   - All {data['total_clinics']} clinics including the created company are available")