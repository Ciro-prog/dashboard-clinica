#!/usr/bin/env python3
"""
Debug endpoint to test admin authentication and database access.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.auth.security import verify_token
from app.models.admin import AdminInDB


async def debug_admin_token():
    """Debug admin token verification"""
    print("Debug Admin Token Verification")
    print("-" * 40)
    
    # Test token (fresh token)
    test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AY2xpbmljYS1kYXNoYm9hcmQuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwidHlwZSI6ImFkbWluIiwiZXhwIjoxNzU0NTQ5MzMxfQ.mHP2mnHEA0-zvOtgoxjfx_sj3SORmgcc0XqtKwkgS6A"
    
    try:
        # Step 1: Verify token
        print("Step 1: Verifying token...")
        payload = verify_token(test_token)
        print(f"Token payload: {payload}")
        
        # Step 2: Check user type
        user_type = payload.get("type")
        print(f"User type: {user_type}")
        
        if user_type != "admin":
            print("ERROR: Not an admin token")
            return
        
        # Step 3: Connect to database
        print("Step 3: Connecting to database...")
        await connect_to_mongo()
        print("Database connected")
        
        # Step 4: Get admin from database
        print("Step 4: Getting admin from database...")
        admins_collection = await get_collection("admins")
        admin = await admins_collection.find_one({"username": payload["sub"]})
        
        if not admin:
            print("ERROR: Admin not found in database")
            return
            
        print(f"Admin found: {admin.get('username')} ({admin.get('role')})")
        
        # Step 5: Try to create AdminInDB model
        print("Step 5: Creating AdminInDB model...")
        try:
            admin_model = AdminInDB(**admin)
            print(f"AdminInDB created successfully!")
            print(f"Admin ID: {admin_model.id}")
            print(f"Admin username: {admin_model.username}")
            print(f"Admin role: {admin_model.role}")
        except Exception as e:
            print(f"ERROR creating AdminInDB model: {e}")
            print(f"Admin document structure: {admin.keys()}")
            return
        
        # Step 6: Test plans collection access
        print("Step 6: Testing plans collection...")
        plans_collection = await get_collection("subscription_plans")
        plans_count = await plans_collection.count_documents({})
        print(f"Total plans in database: {plans_count}")
        
        if plans_count > 0:
            # Get first plan
            first_plan = await plans_collection.find_one({})
            print(f"First plan: {first_plan.get('name')} ({first_plan.get('plan_id')})")
        
        print("\nSUCCESS: All steps completed!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()
        print("Database connection closed")


async def main():
    """Main function"""
    print("Admin Authentication Debug Script")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    await debug_admin_token()


if __name__ == "__main__":
    asyncio.run(main())