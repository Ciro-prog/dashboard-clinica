#!/usr/bin/env python3
"""
Test script to verify admin API authentication and subscription plans endpoint.
"""

import asyncio
import aiohttp
import json
from datetime import datetime


async def test_admin_login_and_plans():
    """Test admin login and subscription plans API"""
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        print("🔐 Testing Admin Login...")
        
        # Step 1: Login as admin
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            async with session.post(
                f"{base_url}/api/auth/admin/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    login_result = await response.json()
                    token = login_result.get("access_token")
                    print(f"✅ Login successful! Token type: {login_result.get('token_type')}")
                    print(f"📄 Token (first 50 chars): {token[:50]}...")
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: Status {response.status}")
                    print(f"❌ Error: {error_text}")
                    return
                
        except Exception as e:
            print(f"❌ Login error: {e}")
            return
        
        # Step 2: Test subscription plans endpoint
        print(f"\n📋 Testing Subscription Plans API...")
        
        try:
            async with session.get(
                f"{base_url}/api/admin/subscription-plans/",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            ) as response:
                print(f"📊 API Response Status: {response.status}")
                
                if response.status == 200:
                    plans_data = await response.json()
                    print(f"✅ API call successful!")
                    print(f"📄 Response type: {type(plans_data)}")
                    print(f"🔍 Is array: {isinstance(plans_data, list)}")
                    
                    if isinstance(plans_data, list):
                        print(f"📊 Plans count: {len(plans_data)}")
                        
                        for i, plan in enumerate(plans_data):
                            print(f"  📋 Plan {i+1}: {plan.get('name')} (${plan.get('price')}/mes)")
                            print(f"      ID: {plan.get('plan_id')}")
                            print(f"      Active: {plan.get('is_active')}")
                            print(f"      Custom: {plan.get('is_custom')}")
                    
                    else:
                        print(f"⚠️  Response is not an array!")
                        print(f"📄 Response structure: {json.dumps(plans_data, indent=2)}")
                
                else:
                    error_text = await response.text()
                    print(f"❌ API call failed: Status {response.status}")
                    print(f"❌ Error: {error_text}")
                
        except Exception as e:
            print(f"❌ API call error: {e}")
        
        # Step 3: Test creating a new plan
        print(f"\n🆕 Testing Plan Creation...")
        
        test_plan_data = {
            "plan_id": "api-test-plan",
            "name": "Plan API Test",
            "description": "Plan creado via API para testing",
            "price": 19.99,
            "currency": "USD",
            "duration_days": 30,
            "max_professionals": 3,
            "max_patients": 100,
            "storage_limit_gb": 15,
            "features": {
                "whatsapp_integration": True,
                "patient_history": True,
                "appointment_scheduling": False,
                "medical_records": False,
                "analytics_dashboard": False,
                "custom_branding": False,
                "api_access": False,
                "priority_support": False
            },
            "is_active": True,
            "display_order": 10,
            "color": "#DC2626",
            "highlight": False
        }
        
        try:
            # First delete if exists
            async with session.delete(
                f"{base_url}/api/admin/subscription-plans/api-test-plan",
                headers={"Authorization": f"Bearer {token}"}
            ) as response:
                if response.status == 200:
                    print("🗑️ Existing test plan deleted")
                
            # Create new plan
            async with session.post(
                f"{base_url}/api/admin/subscription-plans/",
                json=test_plan_data,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            ) as response:
                print(f"📊 Create Plan Status: {response.status}")
                
                if response.status == 201:
                    create_result = await response.json()
                    print(f"✅ Plan created successfully!")
                    print(f"📋 Created plan: {create_result.get('name')}")
                    print(f"💰 Price: ${create_result.get('price')}")
                else:
                    error_text = await response.text()
                    print(f"❌ Plan creation failed: Status {response.status}")
                    print(f"❌ Error: {error_text}")
                
        except Exception as e:
            print(f"❌ Plan creation error: {e}")


async def main():
    """Main function"""
    print("🚀 Admin API Test Script")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    await test_admin_login_and_plans()
    
    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("If you see plans listed above, the API is working correctly.")
    print("If the frontend still doesn't show plans, the issue is in the frontend code.")


if __name__ == "__main__":
    asyncio.run(main())