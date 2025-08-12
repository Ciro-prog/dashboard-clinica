#!/usr/bin/env python3
"""
Test script to verify admin panel endpoints are working correctly
Tests: clinic update, payment recording, and other admin operations
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_admin_login():
    """Test admin authentication"""
    print("[AUTH] Testing admin login...")
    
    response = requests.post(f"{BASE_URL}/api/auth/login", 
        json={
            "username": "admin",
            "password": "admin123",
            "user_type": "admin"
        },
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"[SUCCESS] Admin login successful, token: {token[:20]}...")
        return token
    else:
        print(f"[ERROR] Admin login failed: {response.status_code} - {response.text}")
        return None

def test_clinic_update(token, clinic_id):
    """Test clinic information update"""
    print(f"[UPDATE] Testing clinic update for {clinic_id}...")
    
    update_data = {
        "name_clinic": "Clinica de Prueba Actualizada",
        "suscriber": "Dr. Juan Perez Actualizado",
        "email": "admin@clinicadeciro.com",
        "cell_phone": "+549123456789",
        "address": "Nueva Direccion 123, CABA",
        "subscription_plan": "premium",
        "status_clinic": "active"
    }
    
    response = requests.put(f"{BASE_URL}/api/admin/clinics/{clinic_id}",
        json=update_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[SUCCESS] Clinic update successful: {data.get('name_clinic')}")
        return True
    else:
        print(f"[ERROR] Clinic update failed: {response.status_code} - {response.text}")
        return False

def test_payment_recording(token, clinic_id):
    """Test payment recording"""
    print(f"[PAYMENT] Testing payment recording for {clinic_id}...")
    
    payment_data = {
        "amount": 299.99,
        "payment_method": "credit_card",
        "description": "Pago mensual - Test",
        "reference_number": "TXN123456789",
        "update_subscription": True,
        "selected_plan": "premium",
        "extension_days": 30
    }
    
    response = requests.post(f"{BASE_URL}/api/admin/clinics/{clinic_id}/payments",
        json=payment_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[SUCCESS] Payment recording successful: ${data['payment']['amount']}")
        return True
    else:
        print(f"[ERROR] Payment recording failed: {response.status_code} - {response.text}")
        return False

def test_payment_history(token, clinic_id):
    """Test payment history retrieval"""
    print(f"[HISTORY] Testing payment history for {clinic_id}...")
    
    response = requests.get(f"{BASE_URL}/api/admin/clinics/{clinic_id}/payments",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"[SUCCESS] Payment history retrieved: {len(data)} records")
        return True
    else:
        print(f"[ERROR] Payment history failed: {response.status_code} - {response.text}")
        return False

def main():
    print(">> Testing Admin Panel Endpoints\n")
    
    # Test admin login
    token = test_admin_login()
    if not token:
        sys.exit(1)
    
    # Use a test clinic ID (adjust as needed)
    clinic_id = "clinica-clinicadecir-234830fji"  # Known test clinic
    
    print(f"\n>> Testing operations for clinic: {clinic_id}\n")
    
    # Test all endpoints
    results = []
    results.append(("Clinic Update", test_clinic_update(token, clinic_id)))
    results.append(("Payment Recording", test_payment_recording(token, clinic_id)))
    results.append(("Payment History", test_payment_history(token, clinic_id)))
    
    # Summary
    print(f"\n>> Test Results Summary:")
    print("=" * 40)
    
    success_count = 0
    for test_name, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{test_name:20} {status}")
        if success:
            success_count += 1
    
    print("=" * 40)
    print(f"Total: {success_count}/{len(results)} tests passed")
    
    if success_count == len(results):
        print(">> All admin panel endpoints are working correctly!")
    else:
        print(">> Some endpoints need attention")

if __name__ == "__main__":
    main()