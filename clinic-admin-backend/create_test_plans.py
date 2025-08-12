#!/usr/bin/env python3
"""
URGENT: Create test subscription plans for admin dashboard
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ''))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.models.subscription_plan import DEFAULT_SUBSCRIPTION_PLANS

async def create_test_plans():
    """Create test subscription plans immediately"""
    try:
        print("=== CREATING TEST SUBSCRIPTION PLANS ===")
        
        await connect_to_mongo()
        plans_collection = await get_collection("subscription_plans")
        
        # Check existing plans
        existing_count = await plans_collection.count_documents({})
        print(f"Existing plans: {existing_count}")
        
        if existing_count > 0:
            print("Plans already exist. Listing them...")
            async for plan in plans_collection.find({}).limit(10):
                print(f"  - {plan.get('plan_id')}: {plan.get('name')} (${plan.get('price', 0)})")
            return
            
        print("Creating test subscription plans...")
        
        # Prepare plans with timestamps
        plans_to_insert = []
        for plan_data in DEFAULT_SUBSCRIPTION_PLANS:
            plan_copy = plan_data.copy()
            plan_copy["created_at"] = datetime.utcnow()
            plan_copy["updated_at"] = datetime.utcnow()
            plans_to_insert.append(plan_copy)
        
        # Insert test plans
        result = await plans_collection.insert_many(plans_to_insert)
        print(f"Created {len(result.inserted_ids)} subscription plans")
        
        # Verify insertion
        total_plans = await plans_collection.count_documents({})
        active_plans = await plans_collection.count_documents({"is_active": True})
        print(f"Total plans now: {total_plans} (Active: {active_plans})")
        
        # List created plans
        print("\nCreated plans:")
        async for plan in plans_collection.find({}):
            print(f"  - {plan['plan_id']}: {plan['name']} (${plan['price']}/month)")
        
        print("=== SUBSCRIPTION PLANS CREATED SUCCESSFULLY ===")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_test_plans())