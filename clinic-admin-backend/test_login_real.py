#!/usr/bin/env python3
"""
Test real login flow and admin endpoints
"""
import requests
import json
import sys

def test_login_flow():
    """Test the actual login and admin endpoints"""
    base_url = "http://localhost:8000"
    
    print("[1/4] Testing login endpoint...")
    
    # Login request
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        # POST login
        response = requests.post(
            f"{base_url}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Login status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Login failed: {response.text}")
            return
            
        login_result = response.json()
        print(f"   Login successful!")
        print(f"   Token type: {login_result.get('token_type')}")
        print(f"   User type: {login_result.get('user_type')}")
        
        token = login_result.get('access_token')
        if not token:
            print("   ERROR: No access token in response")
            return
            
        print(f"   Token: {token[:50]}...")
        
        print("[2/4] Testing admin clinics endpoint...")
        
        # Test admin clinics endpoint
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{base_url}/api/admin/clinics",
            headers=headers
        )
        
        print(f"   Clinics endpoint status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Clinics endpoint error: {response.text}")
        else:
            clinics = response.json()
            print(f"   Clinics found: {len(clinics)}")
        
        print("[3/4] Testing subscription plans endpoint...")
        
        # Test subscription plans
        response = requests.get(
            f"{base_url}/api/admin/subscription-plans",
            headers=headers
        )
        
        print(f"   Plans endpoint status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Plans endpoint error: {response.text}")
        else:
            try:
                plans = response.json()
                print(f"   Plans found: {len(plans)}")
                if isinstance(plans, dict):
                    for plan_id, plan_data in list(plans.items())[:3]:
                        print(f"     - {plan_id}: {plan_data.get('name', 'N/A')}")
                elif isinstance(plans, list):
                    for plan in plans[:3]:
                        print(f"     - {plan.get('plan_id')}: {plan.get('name')}")
            except Exception as e:
                print(f"   Plans parsing error: {e}")
                print(f"   Raw response: {response.text[:200]}")
        
        print("[4/4] Testing dashboard stats endpoint...")
        
        # Test dashboard stats
        response = requests.get(
            f"{base_url}/api/admin/dashboard/stats",
            headers=headers
        )
        
        print(f"   Dashboard status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   Dashboard error: {response.text}")
        else:
            stats = response.json()
            print(f"   Dashboard stats: {stats}")
            
        print("SUCCESS: All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_login_flow()