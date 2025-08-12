#!/usr/bin/env python3
"""
URGENT: Create test clinics for admin dashboard
"""
import asyncio
import sys
import os
from datetime import datetime, date, timedelta

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ''))

from app.core.database import connect_to_mongo, close_mongo_connection, get_collection
from app.auth.security import get_password_hash

async def create_test_clinics():
    """Create test clinics immediately"""
    try:
        print("=== CREATING TEST CLINICS ===")
        
        await connect_to_mongo()
        clinics_collection = await get_collection("clinics")
        
        # Check existing clinics
        existing_count = await clinics_collection.count_documents({})
        print(f"Existing clinics: {existing_count}")
        
        if existing_count > 0:
            print("Clinics already exist. Listing them...")
            async for clinic in clinics_collection.find({}).limit(5):
                print(f"  - {clinic.get('clinic_id')}: {clinic.get('name_clinic')}")
            return
            
        print("Creating test clinics...")
        
        # Test clinics data
        test_clinics = [
            {
                "clinic_id": "clinica-demo-001",
                "name_clinic": "Clínica Médica Demo",
                "suscriber": "Dr. Juan Pérez",
                "email": "demo@clinicamedica.com",
                "cell_phone": "+54911234567",
                "address": "Av. Corrientes 1234, CABA",
                "status_clinic": "active",
                "domain_name": "clinicamedica",
                "email_domain": "clinicamedica.com",
                "subscription_status": "active",
                "subscription_plan": "premium",
                "subscription_expires": (date.today() + timedelta(days=30)).isoformat(),
                "subscription_features": {
                    "whatsapp_integration": True,
                    "patient_history": True,
                    "appointment_scheduling": True,
                    "medical_records": True,
                    "analytics_dashboard": True,
                    "custom_branding": True,
                    "api_access": False,
                    "priority_support": True
                },
                "max_professionals": 15,
                "max_patients": 1000,
                "branding": {
                    "clinic_title": "Clínica Médica Demo",
                    "clinic_subtitle": "Sistema de Gestión Médica",
                    "logo_url": None,
                    "primary_color": "#3B82F6",
                    "secondary_color": "#1E40AF"
                },
                "whatsapp_session_name": "clinica-demo",
                "n8n_folder_name": "Clinica Demo - Operativa",
                "patient_form_fields": [
                    "first_name", "last_name", "dni", "address", "cell_phone", 
                    "mutual", "email", "birth_date"
                ],
                "custom_patient_fields": [],
                "professionals_count": 3,
                "max_professionals_allowed": 15,
                "password_hash": get_password_hash("demo123"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "clinic_id": "clinica-test-002",
                "name_clinic": "Centro Médico Test",
                "suscriber": "Dra. María González",
                "email": "test@centromedico.com",
                "cell_phone": "+54911234568",
                "address": "Av. Santa Fe 5678, CABA",
                "status_clinic": "active",
                "domain_name": "centromedico",
                "email_domain": "centromedico.com",
                "subscription_status": "trial",
                "subscription_plan": "basic",
                "subscription_expires": (date.today() + timedelta(days=15)).isoformat(),
                "subscription_features": {
                    "whatsapp_integration": True,
                    "patient_history": True,
                    "appointment_scheduling": True,
                    "medical_records": True,
                    "analytics_dashboard": False,
                    "custom_branding": False,
                    "api_access": False,
                    "priority_support": False
                },
                "max_professionals": 5,
                "max_patients": 200,
                "branding": {
                    "clinic_title": "Centro Médico Test",
                    "clinic_subtitle": "Sistema de Gestión Médica",
                    "logo_url": None,
                    "primary_color": "#10B981",
                    "secondary_color": "#059669"
                },
                "whatsapp_session_name": "centro-test",
                "n8n_folder_name": "Centro Test - Operativa",
                "patient_form_fields": [
                    "first_name", "last_name", "dni", "cell_phone", "email"
                ],
                "custom_patient_fields": [],
                "professionals_count": 2,
                "max_professionals_allowed": 5,
                "password_hash": get_password_hash("test123"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
        ]
        
        # Insert test clinics
        result = await clinics_collection.insert_many(test_clinics)
        print(f"Created {len(result.inserted_ids)} test clinics")
        
        # Verify insertion
        total_clinics = await clinics_collection.count_documents({})
        print(f"Total clinics now: {total_clinics}")
        
        print("=== TEST CLINICS CREATED SUCCESSFULLY ===")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_test_clinics())