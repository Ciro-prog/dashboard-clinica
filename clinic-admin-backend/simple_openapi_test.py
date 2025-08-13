#!/usr/bin/env python3
"""
Simple test for OpenAPI documentation
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def main():
    print("=== OpenAPI Documentation Test ===")
    
    try:
        # Test OpenAPI schema
        print("\n1. Testing OpenAPI schema...")
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=10)
        
        if response.status_code == 200:
            schema = response.json()
            paths = schema.get('paths', {})
            
            # Check for services endpoints
            services_endpoints = [
                '/api/clinics/{clinic_id}/services',
                '/api/clinics/{clinic_id}/schedule', 
                '/api/clinics/{clinic_id}/contact-info',
                '/api/clinics/{clinic_id}/services/initialize'
            ]
            
            print(f"Total endpoints in schema: {len(paths)}")
            
            found = 0
            for endpoint in services_endpoints:
                if endpoint in paths:
                    found += 1
                    print(f"FOUND: {endpoint}")
                else:
                    print(f"MISSING: {endpoint}")
            
            print(f"Services endpoints found: {found}/{len(services_endpoints)}")
            
            if found == len(services_endpoints):
                print("SUCCESS: All services endpoints in OpenAPI schema")
            else:
                print("WARNING: Server restart needed to load new endpoints")
        
        else:
            print(f"ERROR: OpenAPI schema not accessible: {response.status_code}")
        
        # Test docs page
        print("\n2. Testing docs page...")
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        
        if response.status_code == 200:
            print("SUCCESS: Docs page accessible at http://localhost:8000/docs")
        else:
            print(f"ERROR: Docs page issue: {response.status_code}")
        
        # Test live endpoint
        print("\n3. Testing live services endpoint...")
        
        # Get clinic ID
        response = requests.get(f"{BASE_URL}/debug/clinics", 
                               headers={"X-API-Key": "test123456"}, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('clinics'):
                clinic_id = data['clinics'][0]['_id']
                
                # Test services endpoint
                services_url = f"{BASE_URL}/api/clinics/{clinic_id}/services"
                response = requests.get(services_url, 
                                       headers={"X-API-Key": "test123456"}, timeout=10)
                
                if response.status_code == 200:
                    print("SUCCESS: Services endpoint working")
                    result = response.json()
                    print(f"Clinic: {result.get('clinic_name')}")
                    print(f"Services: {len(result.get('services', []))}")
                elif response.status_code == 404:
                    print("ERROR: Services endpoint returns 404 - Server restart needed")
                else:
                    print(f"ERROR: Services endpoint failed: {response.status_code}")
            else:
                print("ERROR: No clinics available for testing")
        else:
            print("ERROR: Cannot access clinic list")
        
        print("\n=== Test Complete ===")
        
    except Exception as e:
        print(f"ERROR: Test failed: {e}")

if __name__ == "__main__":
    main()