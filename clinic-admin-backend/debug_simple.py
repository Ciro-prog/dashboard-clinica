#!/usr/bin/env python3
"""
Simple debug test for subscription plans
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ''))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.models.subscription_plan import SubscriptionPlanInDB

async def debug_subscription_plans():
    """Debug subscription plans loading"""
    try:
        print("[1/3] Connecting to database...")
        await connect_to_mongo()
        
        print("[2/3] Getting subscription plans...")
        plans_collection = await get_collection("subscription_plans")
        cursor = plans_collection.find({"is_active": True}).sort("display_order", 1)
        
        print("   Found plans:")
        async for plan_doc in cursor:
            try:
                print(f"     - Raw plan: {plan_doc.get('plan_id')}")
                plan = SubscriptionPlanInDB.from_mongo(plan_doc)
                print(f"     - Parsed plan: {plan.plan_id}")
                print(f"     - Features type: {type(plan.features)}")
                print(f"     - Features: {plan.features}")
                
                # Test model_dump
                try:
                    features_dict = plan.features.model_dump()
                    print(f"     - Features dict: {features_dict}")
                except Exception as fe:
                    print(f"     - Features model_dump error: {fe}")
                    
            except Exception as pe:
                print(f"     - Plan parsing error: {pe}")
                print(f"     - Plan doc: {plan_doc}")
                
        print("[3/3] Test completed!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(debug_subscription_plans())