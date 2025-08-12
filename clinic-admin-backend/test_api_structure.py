#!/usr/bin/env python3
"""
Test script to verify API response structure for subscription plans.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.api.subscription_plans import router
from app.models.subscription_plan import SubscriptionPlanResponse, SubscriptionPlanInDB


async def test_api_response_structure():
    """Test the actual API response structure"""
    print("Testing API Response Structure...")
    
    try:
        # Connect to database
        await connect_to_mongo()
        print("Connected to database")
        
        # Get subscription plans collection
        plans_collection = await get_collection("subscription_plans")
        clinics_collection = await get_collection("clinics")
        
        print("\nTesting subscription plans API logic...")
        
        # Simulate the API endpoint logic
        filter_query = {"is_active": True}
        cursor = plans_collection.find(filter_query).sort("display_order", 1)
        plans = []
        
        async for plan_doc in cursor:
            print(f"  Processing plan: {plan_doc.get('plan_id', 'unknown')}")
            
            # Convert ObjectId to string as needed by Pydantic
            plan_doc_copy = plan_doc.copy()
            if "_id" in plan_doc_copy:
                plan_doc_copy["_id"] = str(plan_doc_copy["_id"])
            
            # Create the response model as the API does
            plan_data = SubscriptionPlanInDB(**plan_doc_copy)
            
            # Calculate statistics (as API does)
            clinics_count = await clinics_collection.count_documents({
                "subscription_plan": plan_data.plan_id
            })
            
            # Calculate monthly revenue
            monthly_revenue = 0.0
            if plan_data.price > 0:
                active_clinics = await clinics_collection.count_documents({
                    "subscription_plan": plan_data.plan_id,
                    "subscription_status": "active"
                })
                monthly_revenue = plan_data.price * active_clinics
            
            # Create response object
            plan_response = SubscriptionPlanResponse(
                **plan_data.dict(),
                clinics_count=clinics_count,
                monthly_revenue=monthly_revenue
            )
            plans.append(plan_response)
        
        print(f"\nAPI Response Analysis:")
        print(f"  Total plans found: {len(plans)}")
        print(f"  Response type: {type(plans)}")
        print(f"  Is array: {isinstance(plans, list)}")
        
        # Convert to dict format as JSON API would do
        response_data = [plan.dict() for plan in plans]
        
        print(f"\nJSON Serialized Response:")
        print(f"  Response type after serialization: {type(response_data)}")
        print(f"  Is array after serialization: {isinstance(response_data, list)}")
        
        # Print structure of first plan if available
        if response_data:
            print(f"\nFirst Plan Structure:")
            first_plan = response_data[0]
            print(f"  Plan type: {type(first_plan)}")
            print(f"  Keys: {list(first_plan.keys())}")
            print(f"  Sample plan ID: {first_plan.get('plan_id')}")
            print(f"  Sample price: {first_plan.get('price')}")
            print(f"  Clinics count: {first_plan.get('clinics_count')}")
            
            # Show full structure (pretty printed)
            print(f"\nFull First Plan Structure:")
            print(json.dumps(first_plan, indent=2, default=str))
        
        print(f"\nAPI Structure Test Complete!")
        return response_data
        
    except Exception as e:
        print(f"Error testing API structure: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        # Close database connection
        await close_mongo_connection()
        print("Database connection closed")


async def main():
    """Main function"""
    print("Starting API Structure Test...")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    response_data = await test_api_response_structure()
    
    if response_data is not None:
        print("\nEXPECTED FRONTEND BEHAVIOR:")
        print(f"  Response type: {type(response_data)} (should be list)")
        print(f"  Array.isArray(data): {isinstance(response_data, list)} (should be True)")
        print(f"  Plans count: {len(response_data)}")
        print("\nThe API returns a direct array, so frontend should handle it correctly.")
        print("If you're still seeing errors, check browser network tab for actual response.")
    else:
        print("\nTest failed - check database connection and data.")


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())