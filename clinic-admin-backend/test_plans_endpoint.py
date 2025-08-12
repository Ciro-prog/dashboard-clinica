#!/usr/bin/env python3
"""
Test script to simulate the exact subscription plans endpoint logic.
"""

import asyncio
import sys
import os
from datetime import datetime
import json

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.models.subscription_plan import SubscriptionPlanResponse, SubscriptionPlanInDB


async def test_plans_endpoint_logic():
    """Test the exact logic from list_subscription_plans endpoint"""
    print("Testing Subscription Plans Endpoint Logic")
    print("-" * 50)
    
    try:
        # Connect to database
        await connect_to_mongo()
        print("Database connected")
        
        # Get collections
        plans_collection = await get_collection("subscription_plans")
        clinics_collection = await get_collection("clinics")
        
        # Build filter (same as endpoint)
        include_inactive = False
        filter_query = {}
        if not include_inactive:
            filter_query["is_active"] = True
            
        print(f"Filter query: {filter_query}")
        
        # Get cursor
        cursor = plans_collection.find(filter_query).sort("display_order", 1)
        plans = []
        
        async for plan_doc in cursor:
            print(f"Processing plan: {plan_doc.get('plan_id')}")
            
            # Convert ObjectId to string for Pydantic
            plan_doc_copy = plan_doc.copy()
            if "_id" in plan_doc_copy:
                plan_doc_copy["_id"] = str(plan_doc_copy["_id"])
            
            try:
                # Create the response model as the API does
                plan_data = SubscriptionPlanInDB(**plan_doc_copy)
                print(f"  SubscriptionPlanInDB created successfully")
                
                # Calculate statistics (as API does)
                clinics_count = await clinics_collection.count_documents({
                    "subscription_plan": plan_data.plan_id
                })
                print(f"  Clinics count: {clinics_count}")
                
                # Calculate monthly revenue
                monthly_revenue = 0.0
                if plan_data.price > 0:
                    active_clinics = await clinics_collection.count_documents({
                        "subscription_plan": plan_data.plan_id,
                        "subscription_status": "active"
                    })
                    monthly_revenue = plan_data.price * active_clinics
                print(f"  Monthly revenue: ${monthly_revenue}")
                
                # Create response object (this is where it might fail)
                plan_response = SubscriptionPlanResponse(
                    **plan_data.model_dump(),  # Use model_dump instead of dict()
                    clinics_count=clinics_count,
                    monthly_revenue=monthly_revenue
                )
                plans.append(plan_response)
                print(f"  SubscriptionPlanResponse created successfully")
                
            except Exception as e:
                print(f"  ERROR processing plan {plan_doc.get('plan_id')}: {e}")
                print(f"  Plan doc keys: {plan_doc.keys()}")
                continue
        
        print(f"\nTotal plans processed: {len(plans)}")
        
        # Convert to JSON format as the API would
        if plans:
            response_data = [plan.model_dump() for plan in plans]
            print(f"JSON serialization successful: {len(response_data)} plans")
            
            # Show first plan structure
            if response_data:
                first_plan = response_data[0]
                print(f"\nFirst plan structure:")
                print(json.dumps(first_plan, indent=2, default=str))
                
            return response_data
        else:
            print("ERROR: No plans were processed successfully")
            return None
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    finally:
        await close_mongo_connection()
        print("Database connection closed")


async def main():
    """Main function"""
    print("Subscription Plans Endpoint Test")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    result = await test_plans_endpoint_logic()
    
    if result:
        print(f"\nSUCCESS: Endpoint logic works correctly!")
        print(f"Returns: List of {len(result)} plans")
        print("The issue is likely in the HTTP request/response handling or frontend.")
    else:
        print(f"\nFAILED: There's an issue with the endpoint logic.")


if __name__ == "__main__":
    asyncio.run(main())