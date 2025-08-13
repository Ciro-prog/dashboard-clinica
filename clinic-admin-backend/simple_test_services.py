#!/usr/bin/env python3
"""
Simple test for services endpoint functionality
Tests the new services endpoints with basic functionality
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"
API_KEY = "test123456"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def test_health():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_clinics_list():
    """Test basic clinics list"""
    try:
        response = requests.get(f"{BASE_URL}/debug/clinics", headers=HEADERS, timeout=5)
        print(f"Clinics list: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total_clinics', 0)} clinics")
            if data.get('clinics'):
                first_clinic = data['clinics'][0]
                clinic_id = first_clinic.get('_id')
                print(f"First clinic ID: {clinic_id}")
                return clinic_id
        return None
    except Exception as e:
        print(f"Clinics list failed: {e}")
        return None

def test_services_endpoint(clinic_id):
    """Test the services endpoint"""
    try:
        url = f"{BASE_URL}/api/clinics/{clinic_id}/services"
        print(f"Testing services endpoint: {url}")
        
        response = requests.get(url, headers=HEADERS, timeout=10)
        print(f"Services endpoint: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Services endpoint SUCCESS!")
            print(f"Clinic: {data.get('clinic_name')}")
            print(f"Services: {len(data.get('services', []))}")
            print(f"Professionals: {len(data.get('professionals', []))}")
            return True
        else:
            print(f"Services endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"Services endpoint error: {e}")
        return False

def main():
    """Main test function"""
    print("=== Simple Services Endpoint Test ===")
    
    # Test 1: Health check
    print("\n1. Testing server health...")
    if not test_health():
        print("❌ Server is not running")
        sys.exit(1)
    
    # Test 2: Get clinic ID
    print("\n2. Getting clinic list...")
    clinic_id = test_clinics_list()
    if not clinic_id:
        print("❌ Could not get clinic ID")
        sys.exit(1)
    
    # Test 3: Test services endpoint
    print("\n3. Testing services endpoint...")
    if test_services_endpoint(clinic_id):
        print("✅ Services endpoint working!")
    else:
        print("❌ Services endpoint failed")
        sys.exit(1)
    
    print("\n✅ All tests passed!")

if __name__ == "__main__":
    main()