#!/usr/bin/env python3
"""
Test script to verify OpenAPI documentation for new services endpoints
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_openapi_schema():
    """Test if OpenAPI schema includes new services endpoints"""
    try:
        print("🔍 Testing OpenAPI schema...")
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ OpenAPI schema not accessible: {response.status_code}")
            return False
            
        schema = response.json()
        paths = schema.get('paths', {})
        
        # Check for new services endpoints
        expected_endpoints = [
            '/api/clinics/{clinic_id}/services',
            '/api/clinics/{clinic_id}/schedule', 
            '/api/clinics/{clinic_id}/contact-info',
            '/api/clinics/{clinic_id}/services/initialize'
        ]
        
        found_endpoints = []
        missing_endpoints = []
        
        for endpoint in expected_endpoints:
            if endpoint in paths:
                found_endpoints.append(endpoint)
                print(f"✅ Found: {endpoint}")
            else:
                missing_endpoints.append(endpoint)
                print(f"❌ Missing: {endpoint}")
        
        # Check tags
        tags = schema.get('tags', [])
        clinic_services_tag = any(tag.get('name') == 'Clinic Services' for tag in tags)
        
        print(f"\n📊 Summary:")
        print(f"   Total endpoints found: {len(found_endpoints)}/{len(expected_endpoints)}")
        print(f"   'Clinic Services' tag: {'✅' if clinic_services_tag else '❌'}")
        
        if missing_endpoints:
            print(f"   Missing endpoints: {missing_endpoints}")
            print("\n⚠️ Server restart required to load new endpoints")
            return False
        
        print("✅ All services endpoints found in OpenAPI schema!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing OpenAPI schema: {e}")
        return False

def test_docs_page():
    """Test if docs page is accessible"""
    try:
        print("\n🌐 Testing docs page accessibility...")
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        
        if response.status_code == 200 and 'swagger' in response.text.lower():
            print("✅ Docs page accessible at http://localhost:8000/docs")
            return True
        else:
            print(f"❌ Docs page issue: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error accessing docs page: {e}")
        return False

def test_services_endpoint_live():
    """Test if services endpoints are actually working"""
    try:
        print("\n🔧 Testing live services endpoint...")
        
        # Get a clinic ID first
        response = requests.get(f"{BASE_URL}/debug/clinics", 
                               headers={"X-API-Key": "test123456"}, timeout=5)
        
        if response.status_code != 200:
            print("❌ Cannot get clinic list")
            return False
            
        data = response.json()
        if not data.get('clinics'):
            print("❌ No clinics available")
            return False
            
        clinic_id = data['clinics'][0]['_id']
        print(f"   Testing with clinic ID: {clinic_id}")
        
        # Test services endpoint
        services_url = f"{BASE_URL}/api/clinics/{clinic_id}/services"
        response = requests.get(services_url, 
                               headers={"X-API-Key": "test123456"}, timeout=10)
        
        if response.status_code == 200:
            print("✅ Services endpoint is working!")
            data = response.json()
            print(f"   Clinic: {data.get('clinic_name', 'Unknown')}")
            print(f"   Services: {len(data.get('services', []))}")
            print(f"   Professionals: {len(data.get('professionals', []))}")
            return True
        elif response.status_code == 404:
            print("❌ Services endpoint returns 404 - Server restart needed")
            return False
        else:
            print(f"❌ Services endpoint error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing live endpoint: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("🧪 OpenAPI Documentation Test Suite")
    print("=" * 60)
    
    # Test 1: OpenAPI schema
    schema_ok = test_openapi_schema()
    
    # Test 2: Docs page
    docs_ok = test_docs_page()
    
    # Test 3: Live endpoint
    live_ok = test_services_endpoint_live()
    
    print("\n" + "=" * 60)
    print("📋 Final Results:")
    print(f"   OpenAPI Schema: {'✅' if schema_ok else '❌'}")
    print(f"   Docs Page: {'✅' if docs_ok else '❌'}")
    print(f"   Live Endpoint: {'✅' if live_ok else '❌'}")
    
    if not schema_ok or not live_ok:
        print("\n🔄 RECOMMENDATION: Restart the FastAPI server to load new endpoints")
        print("   cd clinic-admin-backend")
        print("   python main.py")
        print("\n📖 After restart, docs will be available at:")
        print("   http://localhost:8000/docs")
        print("   http://localhost:8000/redoc")
    else:
        print("\n🎉 All tests passed! Documentation ready for use.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()