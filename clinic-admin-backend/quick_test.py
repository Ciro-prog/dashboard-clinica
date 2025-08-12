#!/usr/bin/env python3
"""
Quick test of specific endpoint
"""
import requests
import json

def quick_test():
    base_url = "http://localhost:8000"
    
    # Login
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            return
            
        token = response.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test subscription plans
        response = requests.get(f"{base_url}/api/admin/subscription-plans", headers=headers)
        print(f"Subscription plans: {response.status_code}")
        if response.status_code == 200:
            plans = response.json()
            print(f"Plans: {type(plans)} - {len(plans) if isinstance(plans, (list, dict)) else 'unknown'}")
            
        # Test clinics
        response = requests.get(f"{base_url}/api/admin/clinics", headers=headers)
        print(f"Clinics: {response.status_code}")
        if response.status_code == 200:
            clinics = response.json()
            print(f"Clinics: {type(clinics)} - {len(clinics) if isinstance(clinics, (list, dict)) else 'unknown'}")
        elif response.status_code == 500:
            print(f"Clinics error: {response.text[:100]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    quick_test()