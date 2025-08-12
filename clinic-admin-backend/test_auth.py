#!/usr/bin/env python3
"""
Test authentication and authorization flow
"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ''))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.auth.security import verify_password, create_admin_token, verify_token

async def test_auth_flow():
    """Test the complete authentication flow"""
    try:
        # Connect to database
        print("[1/6] Connecting to database...")
        await connect_to_mongo()
        
        # Get admin user
        print("[2/6] Getting admin user...")
        admins_collection = await get_collection("admins")
        admin = await admins_collection.find_one({"username": "admin"})
        
        if not admin:
            print("ERROR: No admin user found")
            return
            
        print(f"SUCCESS: Admin found: {admin['username']}")
        print(f"   Email: {admin.get('email', 'N/A')}")
        print(f"   Role: {admin.get('role', 'N/A')}")
        print(f"   Active: {admin.get('is_active', 'N/A')}")
        
        # Test password (assuming default password is 'admin123')
        print("[3/6] Testing password verification...")
        password_valid = verify_password("admin123", admin["password_hash"])
        print(f"   Password valid: {password_valid}")
        
        if not password_valid:
            print("ERROR: Password verification failed")
            return
            
        # Create admin token
        print("[4/6] Creating admin token...")
        token = create_admin_token(admin)
        print(f"   Token created: {token[:50]}...")
        
        # Verify token
        print("[5/6] Verifying token...")
        payload = verify_token(token)
        print(f"   Token payload:")
        print(f"   - Type: {payload.get('type')}")
        print(f"   - Subject: {payload.get('sub')}")
        print(f"   - Role: {payload.get('role')}")
        print(f"   - Email: {payload.get('email')}")
        
        # Check subscription plans
        print("[6/6] Checking subscription plans...")
        plans_collection = await get_collection("subscription_plans")
        plan_count = await plans_collection.count_documents({})
        print(f"   Total plans: {plan_count}")
        
        if plan_count > 0:
            plans = await plans_collection.find({}).limit(3).to_list(length=3)
            for plan in plans:
                print(f"   - {plan.get('plan_id')}: {plan.get('name')}")
        
        print("SUCCESS: Authentication flow test completed!")
        
    except Exception as e:
        print(f"ERROR during auth test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_auth_flow())