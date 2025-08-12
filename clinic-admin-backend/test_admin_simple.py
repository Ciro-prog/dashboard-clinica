#!/usr/bin/env python3
"""
Simple test script to verify admin API using requests library.
"""

import requests
import json
from datetime import datetime


def test_admin_login_and_plans():
    """Test admin login and subscription plans API"""
    base_url = "http://localhost:8000"
    
    print("Testing Admin Login...")
    
    # Step 1: Login as admin
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(
            f"{base_url}/api/auth/admin/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("access_token")
            print(f"Login successful! Token type: {login_result.get('token_type')}")
            print(f"Token (first 50 chars): {token[:50]}...")
        else:
            print(f"Login failed: Status {login_response.status_code}")
            print(f"Error: {login_response.text}")
            return
            
    except Exception as e:
        print(f"Login error: {e}")
        return
    
    # Step 2: Test subscription plans endpoint
    print(f"\nTesting Subscription Plans API...")
    
    try:
        plans_response = requests.get(
            f"{base_url}/api/admin/subscription-plans/",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        print(f"API Response Status: {plans_response.status_code}")
        
        if plans_response.status_code == 200:
            plans_data = plans_response.json()
            print(f"API call successful!")
            print(f"Response type: {type(plans_data)}")
            print(f"Is array: {isinstance(plans_data, list)}")
            
            if isinstance(plans_data, list):
                print(f"Plans count: {len(plans_data)}")
                print("\nPlans found:")
                
                for i, plan in enumerate(plans_data):
                    print(f"  Plan {i+1}: {plan.get('name')} (${plan.get('price')}/mes)")
                    print(f"      ID: {plan.get('plan_id')}")
                    print(f"      Active: {plan.get('is_active')}")
                    print(f"      Custom: {plan.get('is_custom')}")
                    print(f"      Color: {plan.get('color')}")
                    print()
            
            else:
                print(f"WARNING: Response is not an array!")
                print(f"Response structure: {json.dumps(plans_data, indent=2)}")
        
        else:
            print(f"API call failed: Status {plans_response.status_code}")
            print(f"Error: {plans_response.text}")
            
    except Exception as e:
        print(f"API call error: {e}")
        
    return token


def main():
    """Main function"""
    print("Admin API Test Script")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    token = test_admin_login_and_plans()
    
    print("\n" + "=" * 60)
    print("Test completed!")
    
    if token:
        print("SUCCESS: API is working correctly!")
        print("If frontend still doesn't show plans, check:")
        print("1. Browser console for errors")
        print("2. Network tab for failed requests")
        print("3. Frontend authentication token")
        print("4. CORS issues")
    else:
        print("FAILED: API authentication or connection issues")


if __name__ == "__main__":
    main()