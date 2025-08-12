#!/usr/bin/env python3
"""
Quick overview of all subscription plans in the database.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection


async def show_all_plans():
    """Show a quick overview of all subscription plans"""
    print("Subscription Plans Overview")
    print("=" * 60)
    
    try:
        # Connect to database
        await connect_to_mongo()
        
        # Get collections
        plans_collection = await get_collection("subscription_plans")
        clinics_collection = await get_collection("clinics")
        
        # Get all plans sorted by display_order
        cursor = plans_collection.find({}).sort("display_order", 1)
        
        print(f"{'#':<3} {'Plan ID':<15} {'Name':<20} {'Price':<8} {'Max Prof':<9} {'Max Pat':<8} {'Active':<7} {'Clinics':<8}")
        print("-" * 80)
        
        plan_count = 0
        total_revenue = 0.0
        
        async for plan_doc in cursor:
            plan_count += 1
            
            # Calculate clinic usage
            clinics_count = await clinics_collection.count_documents({
                "subscription_plan": plan_doc.get("plan_id")
            })
            
            # Calculate revenue for this plan
            if plan_doc.get("price", 0) > 0:
                active_clinics = await clinics_collection.count_documents({
                    "subscription_plan": plan_doc.get("plan_id"),
                    "subscription_status": "active"
                })
                plan_revenue = plan_doc.get("price", 0) * active_clinics
                total_revenue += plan_revenue
            
            # Display plan info
            print(f"{plan_count:<3} "
                  f"{plan_doc.get('plan_id', 'N/A'):<15} "
                  f"{plan_doc.get('name', 'N/A')[:19]:<20} "
                  f"${plan_doc.get('price', 0):<7.2f} "
                  f"{plan_doc.get('max_professionals', 0):<9} "
                  f"{plan_doc.get('max_patients', 0):<8} "
                  f"{'Yes' if plan_doc.get('is_active', True) else 'No':<7} "
                  f"{clinics_count:<8}")
            
            # Show description if available
            if plan_doc.get('description'):
                print(f"    Description: {plan_doc.get('description')}")
            
            # Show features if available
            features = plan_doc.get('features', [])
            if features and isinstance(features, list):
                feature_list = features[:3]
                feature_str = ', '.join(str(f) for f in feature_list)
                ellipsis = '...' if len(features) > 3 else ''
                print(f"    Features: {feature_str}{ellipsis}")
            
            print()
        
        print("-" * 80)
        print(f"Summary:")
        print(f"   Total Plans: {plan_count}")
        print(f"   Total Monthly Revenue: ${total_revenue:.2f}")
        
        # Count active vs inactive
        active_count = await plans_collection.count_documents({"is_active": True})
        inactive_count = await plans_collection.count_documents({"is_active": False})
        print(f"   Active Plans: {active_count}")
        print(f"   Inactive Plans: {inactive_count}")
        
        # Most popular plan
        pipeline = [
            {
                "$lookup": {
                    "from": "clinics",
                    "localField": "plan_id",
                    "foreignField": "subscription_plan", 
                    "as": "clinics"
                }
            },
            {
                "$project": {
                    "plan_id": 1,
                    "name": 1,
                    "clinic_count": {"$size": "$clinics"}
                }
            },
            {"$sort": {"clinic_count": -1}},
            {"$limit": 1}
        ]
        
        async for popular_plan in plans_collection.aggregate(pipeline):
            if popular_plan.get("clinic_count", 0) > 0:
                print(f"   Most Popular: {popular_plan.get('name')} ({popular_plan.get('clinic_count')} clinics)")
        
        print("\nPlans overview completed successfully!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()


async def main():
    """Main function"""
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    await show_all_plans()


if __name__ == "__main__":
    asyncio.run(main())