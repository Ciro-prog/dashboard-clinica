#!/usr/bin/env python3
"""
Test script for the new services endpoint
Run this to test the /api/clinics/{clinic_id}/services endpoint
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import httpx

# Test configuration
BASE_URL = "http://localhost:8000"
API_KEY = "test123456"

# Test clinic IDs (from your existing data)
TEST_CLINICS = [
    "68982920bf08a5d758d1b6dc",  # test-clinic-001
    "68982920bf08a5d758d1b6dd"   # clinica-demo
]

async def test_services_endpoint():
    """Test the services endpoint"""
    print("🧪 Testing Services Endpoint")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        for clinic_id in TEST_CLINICS:
            print(f"\n📋 Testing clinic: {clinic_id}")
            
            try:
                # Test GET /api/clinics/{clinic_id}/services
                response = await client.get(
                    f"{BASE_URL}/api/clinics/{clinic_id}/services",
                    headers={"X-API-Key": API_KEY}
                )
                
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Success! Clinic: {data.get('clinic_name', 'Unknown')}")
                    print(f"   Services: {len(data.get('services', []))}")
                    print(f"   Professionals: {len(data.get('professionals', []))}")
                    print(f"   Specialties: {len(data.get('specialties', []))}")
                    print(f"   Schedule: {data.get('schedule', {}).get('timezone', 'No timezone')}")
                    
                    # Print first service as example
                    services = data.get('services', [])
                    if services:
                        first_service = services[0]
                        print(f"   Example Service: {first_service.get('service_type')} - ${first_service.get('base_price')}")
                    
                    # Print professionals
                    professionals = data.get('professionals', [])
                    for prof in professionals:
                        print(f"   Professional: {prof.get('first_name')} {prof.get('last_name')} - {prof.get('speciality')}")
                
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"   Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Exception: {str(e)}")

async def test_initialize_endpoint():
    """Test the initialize endpoint"""
    print("\n\n🚀 Testing Initialize Endpoint")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        clinic_id = TEST_CLINICS[0]  # Test with first clinic
        print(f"\n📋 Initializing clinic: {clinic_id}")
        
        try:
            # Test POST /api/clinics/{clinic_id}/services/initialize
            response = await client.post(
                f"{BASE_URL}/api/clinics/{clinic_id}/services/initialize",
                headers={"X-API-Key": API_KEY}
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! {data.get('message')}")
                print(f"   Services initialized: {data.get('services_count')}")
                print(f"   Specialties initialized: {data.get('specialties_count')}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

async def test_update_services():
    """Test updating services"""
    print("\n\n✏️ Testing Update Services Endpoint")
    print("=" * 50)
    
    # Sample services to update
    sample_services = [
        {
            "service_id": "srv_test_1",
            "service_type": "Consulta Test",
            "description": "Consulta de prueba",
            "base_price": 45000.0,
            "currency": "COP",
            "duration_minutes": 30,
            "category": "Test",
            "requires_appointment": True,
            "is_active": True
        }
    ]
    
    async with httpx.AsyncClient() as client:
        clinic_id = TEST_CLINICS[0]
        print(f"\n📋 Updating services for clinic: {clinic_id}")
        
        try:
            response = await client.put(
                f"{BASE_URL}/api/clinics/{clinic_id}/services",
                headers={
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json"
                },
                json=sample_services
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! {data.get('message')}")
                print(f"   Services updated: {data.get('services_count')}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

async def main():
    """Main test function"""
    print("🏥 Clinic Services Endpoint Test Suite")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Clinics: {len(TEST_CLINICS)}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test sequence
    await test_services_endpoint()
    await test_initialize_endpoint()
    await test_services_endpoint()  # Test again after initialization
    await test_update_services()
    await test_services_endpoint()  # Test again after update
    
    print("\n\n✨ Test Suite Complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())