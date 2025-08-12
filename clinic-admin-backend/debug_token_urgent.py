#!/usr/bin/env python3
"""
URGENT: Debug token validation issue
"""
import requests
import json
import jwt

def debug_token_issue():
    """Debug why admin tokens return 403"""
    base_url = "http://localhost:8000"
    
    print("=== URGENT TOKEN DEBUG ===")
    
    # Login
    login_data = {
        "username": "admin",
        "password": "admin123", 
        "user_type": "admin"
    }
    
    try:
        print("[1/4] Login request...")
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"LOGIN FAILED: {response.status_code} - {response.text}")
            return
            
        login_result = response.json()
        token = login_result.get('access_token')
        
        print(f"   Login: SUCCESS")
        print(f"   Token type: {login_result.get('token_type')}")
        print(f"   User type: {login_result.get('user_type')}")
        
        print("[2/4] Decoding token...")
        # Decode token WITHOUT verification to see payload
        try:
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"   Token payload: {json.dumps(decoded, indent=2)}")
        except Exception as e:
            print(f"   Token decode error: {e}")
            
        print("[3/4] Testing admin endpoints...")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test multiple endpoints
        endpoints = [
            "/api/admin/dashboard/stats",
            "/api/admin/clinics", 
            "/api/admin/subscription-plans"
        ]
        
        for endpoint in endpoints:
            try:
                resp = requests.get(f"{base_url}{endpoint}", headers=headers)
                print(f"   {endpoint}: {resp.status_code}")
                if resp.status_code == 403:
                    print(f"     Error: {resp.text}")
                elif resp.status_code == 200:
                    data = resp.json()
                    print(f"     Success: {type(data)} with {len(data) if isinstance(data, (list, dict)) else 'unknown'} items")
            except Exception as e:
                print(f"   {endpoint}: ERROR - {e}")
                
        print("[4/4] Testing token validation...")
        # Test with malformed token
        bad_headers = {"Authorization": f"Bearer invalid_token"}
        resp = requests.get(f"{base_url}/api/admin/clinics", headers=bad_headers)
        print(f"   Bad token test: {resp.status_code} (should be 401)")
        
        print("=== DEBUG COMPLETE ===")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    debug_token_issue()