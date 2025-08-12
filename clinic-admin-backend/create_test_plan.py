#!/usr/bin/env python3
"""
Script to create a test subscription plan for verification.
"""

import asyncio
import sys
import os
from datetime import datetime
from bson import ObjectId

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.models.subscription_plan import SubscriptionPlanCreate, SubscriptionPlanInDB


async def create_test_plan():
    """Create a test subscription plan"""
    print("Creating test subscription plan...")
    
    try:
        # Connect to database
        await connect_to_mongo()
        print("Connected to database")
        
        # Get subscription plans collection
        plans_collection = await get_collection("subscription_plans")
        
        # Define test plan
        test_plan_data = {
            "plan_id": "test-plan",
            "name": "Plan de Prueba",
            "description": "Plan personalizado para pruebas del sistema de administración",
            "price": 49.99,
            "currency": "USD",
            "duration_days": 30,
            "max_professionals": 10,
            "max_patients": 500,
            "storage_limit_gb": 50,
            "features": {
                "whatsapp_integration": True,
                "patient_history": True,
                "appointment_scheduling": True,
                "medical_records": True,
                "analytics_dashboard": True,
                "custom_branding": False,
                "api_access": False,
                "priority_support": False,
                "custom_features": {}
            },
            "is_active": True,
            "is_custom": True,
            "display_order": 5,
            "color": "#F59E0B",
            "highlight": False,
            "created_by": "admin",
            "notes": "Plan de prueba creado para verificar funcionalidad de creación y edición"
        }
        
        # Check if plan already exists
        existing_plan = await plans_collection.find_one({"plan_id": "test-plan"})
        if existing_plan:
            print("Test plan already exists, deleting it first...")
            await plans_collection.delete_one({"plan_id": "test-plan"})
        
        # Create plan document
        plan_doc = test_plan_data.copy()
        plan_doc.update({
            "_id": ObjectId(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Insert into database
        result = await plans_collection.insert_one(plan_doc)
        print(f"Test plan created successfully with ID: {result.inserted_id}")
        
        # Verify the plan was created
        created_plan = await plans_collection.find_one({"plan_id": "test-plan"})
        if created_plan:
            print("Verification successful - Test plan found in database:")
            print(f"  Name: {created_plan['name']}")
            print(f"  Price: ${created_plan['price']}/month")
            print(f"  Max Professionals: {created_plan['max_professionals']}")
            print(f"  Max Patients: {created_plan['max_patients']}")
            print(f"  Color: {created_plan['color']}")
            print(f"  Custom: {created_plan['is_custom']}")
            print(f"  Active: {created_plan['is_active']}")
            
            return True
        else:
            print("ERROR: Test plan was not found after creation")
            return False
        
    except Exception as e:
        print(f"Error creating test plan: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Close database connection
        await close_mongo_connection()
        print("Database connection closed")


async def main():
    """Main function"""
    print("Test Plan Creation Script")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    success = await create_test_plan()
    
    if success:
        print("\nSUCCESS!")
        print("Test plan created successfully.")
        print("You can now:")
        print("  1. Open the admin dashboard")
        print("  2. Navigate to subscription plans")
        print("  3. See the 'Plan de Prueba' in the list")
        print("  4. Test editing functionality")
        print("  5. Test plan activation/deactivation")
    else:
        print("\nFAILED!")
        print("Test plan creation failed. Check the errors above.")


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())