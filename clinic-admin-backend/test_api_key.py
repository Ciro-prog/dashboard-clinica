#!/usr/bin/env python3
"""
Simple test script to verify X-API-Key functionality in FastAPI backend
"""

import requests
import sys

BASE_URL = "http://localhost:8000"
TEST_API_KEY = "test123456"
INVALID_API_KEY = "invalid123"

def test_endpoint(endpoint, headers=None, description=""):
    """Test an endpoint with optional headers"""
    print(f"\n[TEST] {description}")
    print(f"   Endpoint: {endpoint}")
    print(f"   Headers: {headers}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers or {})
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   Result: SUCCESS")
            data = response.json()
            if "authenticated" in data:
                print(f"   Auth Method: {data.get('auth_method', 'unknown')}")
                print(f"   User Type: {data.get('user_type', 'unknown')}")
        else:
            print("   Result: FAILED")
            print(f"   Error: {response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print("   Result: CONNECTION ERROR - Backend not running")
    except Exception as e:
        print(f"   Result: ERROR - {e}")

def main():
    print("Testing X-API-Key functionality")
    print("=" * 50)
    
    # Test 1: Regular health endpoint (no auth required)
    test_endpoint("/health", description="Health endpoint (no auth)")
    
    # Test 2: Authenticated health endpoint with valid API key
    test_endpoint(
        "/api/health-auth", 
        headers={"X-API-Key": TEST_API_KEY},
        description="Authenticated health with valid X-API-Key"
    )
    
    # Test 3: Authenticated health endpoint with invalid API key
    test_endpoint(
        "/api/health-auth", 
        headers={"X-API-Key": INVALID_API_KEY},
        description="Authenticated health with invalid X-API-Key"
    )
    
    # Test 4: Authenticated health endpoint with no auth
    test_endpoint(
        "/api/health-auth",
        description="Authenticated health with no authentication"
    )
    
    # Test 5: API key test endpoint with valid key
    test_endpoint(
        "/api/test-key", 
        headers={"X-API-Key": TEST_API_KEY},
        description="X-API-Key test endpoint with valid key"
    )
    
    # Test 6: Debug plans endpoint with valid API key
    test_endpoint(
        "/debug/plans", 
        headers={"X-API-Key": TEST_API_KEY},
        description="Debug plans with valid X-API-Key"
    )
    
    print("\n" + "=" * 50)
    print("Testing completed!")
    print("\nTo test in Swagger UI:")
    print(f"   1. Go to {BASE_URL}/docs")
    print("   2. Click 'Authorize' button")
    print("   3. Enter API key: test123456")
    print("   4. Try out the endpoints!")

if __name__ == "__main__":
    main()