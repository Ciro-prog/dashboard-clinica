#!/usr/bin/env python3
"""
Script para verificar los planes de suscripción en MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_plans():
    """Verificar planes de suscripción"""
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["clinica"]
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return
    
    # Get subscription plans
    plans_collection = db["subscription_plans"]
    
    # Get all plans
    cursor = plans_collection.find({}).sort("display_order", 1)
    all_plans = []
    
    async for plan in cursor:
        all_plans.append(plan)
    
    print(f"\nTotal plans in database: {len(all_plans)}")
    print("\nAll plans:")
    for i, plan in enumerate(all_plans, 1):
        status = "ACTIVE" if plan.get("is_active", False) else "INACTIVE"
        print(f"{i}. {plan['plan_id']} - {plan['name']} (${plan['price']}) [{status}]")
    
    # Get only active plans
    cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
    active_plans = []
    
    async for plan in cursor:
        active_plans.append(plan)
    
    print(f"\nActive plans: {len(active_plans)}")
    for i, plan in enumerate(active_plans, 1):
        print(f"{i}. {plan['plan_id']} - {plan['name']} (${plan['price']})")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(check_plans())