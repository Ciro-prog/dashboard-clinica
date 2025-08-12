#!/usr/bin/env python3
"""
Simple script to initialize default subscription plans in the database.
Fixed Unicode encoding issues for Windows.
"""

import asyncio
import sys
import os
from datetime import datetime
from bson import ObjectId

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.models.subscription_plan import DEFAULT_SUBSCRIPTION_PLANS


async def initialize_subscription_plans():
    """Initialize default subscription plans in the database"""
    print("Starting subscription plans initialization...")
    
    try:
        # Connect to database
        await connect_to_mongo()
        print("Connected to database")
        
        # Get subscription plans collection
        plans_collection = await get_collection("subscription_plans")
        
        created_plans = []
        updated_plans = []
        
        for plan_config in DEFAULT_SUBSCRIPTION_PLANS:
            plan_id = plan_config["plan_id"]
            print(f"Processing plan: {plan_id}")
            
            # Check if plan already exists
            existing_plan = await plans_collection.find_one({"plan_id": plan_id})
            
            if existing_plan:
                print(f"Plan '{plan_id}' already exists - updating basic info")
                
                # Update only basic information, preserve customizations
                update_data = {
                    "name": plan_config["name"],
                    "description": plan_config["description"],
                    "updated_at": datetime.utcnow()
                }
                
                await plans_collection.update_one(
                    {"plan_id": plan_id},
                    {"$set": update_data}
                )
                updated_plans.append(plan_id)
                print(f"Updated basic information for '{plan_id}'")
                
            else:
                print(f"Creating new plan: {plan_id}")
                
                # Create new plan document
                plan_doc = plan_config.copy()
                plan_doc.update({
                    "_id": ObjectId(),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "created_by": "system"
                })
                
                await plans_collection.insert_one(plan_doc)
                created_plans.append(plan_id)
                print(f"Created plan '{plan_id}' successfully")
        
        # Create index on plan_id for better performance
        await plans_collection.create_index("plan_id", unique=True)
        print("Index created on 'plan_id' field")
        
        # Summary
        print("=" * 50)
        print("INITIALIZATION SUMMARY:")
        print(f"Created plans: {len(created_plans)}")
        for plan_id in created_plans:
            print(f"  + {plan_id}")
        
        print(f"Updated plans: {len(updated_plans)}")
        for plan_id in updated_plans:
            print(f"  ~ {plan_id}")
        
        print(f"Total plans: {len(DEFAULT_SUBSCRIPTION_PLANS)}")
        print("=" * 50)
        
        # Verify final state
        total_plans = await plans_collection.count_documents({})
        active_plans = await plans_collection.count_documents({"is_active": True})
        
        print("FINAL DATABASE STATE:")
        print(f"Total subscription plans: {total_plans}")
        print(f"Active plans: {active_plans}")
        print(f"Inactive plans: {total_plans - active_plans}")
        
        # List all plans
        print("ALL PLANS IN DATABASE:")
        async for plan in plans_collection.find({}).sort("display_order", 1):
            status = "Active" if plan.get("is_active", True) else "Inactive"
            custom = "Custom" if plan.get("is_custom", False) else "System"
            print(f"  {plan['plan_id']}: {plan['name']} | ${plan['price']}/mes | {status} | {custom}")
        
        print("Subscription plans initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error initializing subscription plans: {e}")
        return False
    
    finally:
        # Close database connection
        await close_mongo_connection()
        print("Database connection closed")


async def main():
    """Main function"""
    print("Starting subscription plans initialization...")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    success = await initialize_subscription_plans()
    
    if success:
        print("SUCCESS: All subscription plans have been initialized!")
        print("You can now:")
        print("  - Access the admin dashboard to manage plans")
        print("  - Create new custom plans")
        print("  - Assign plans to clinics")
        sys.exit(0)
    else:
        print("FAILED: Subscription plans initialization failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())