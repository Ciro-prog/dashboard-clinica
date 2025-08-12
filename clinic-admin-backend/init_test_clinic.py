#!/usr/bin/env python3
"""
Script to initialize a test clinic for database testing
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth.security import get_password_hash

async def init_test_clinic():
    """Initialize a test clinic in MongoDB"""
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["clinica-dashboard"]
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return
    
    # Get clinics collection
    clinics_collection = db["clinics"]
    
    # Check if test clinic already exists
    existing = await clinics_collection.find_one({"email": "test@clinica.com"})
    if existing:
        print("Test clinic already exists")
        return
    
    # Create test clinic
    test_clinic = {
        "clinic_id": "test-clinic-001",
        "name_clinic": "Clínica de Prueba",
        "suscriber": "clinica-prueba", 
        "email": "test@clinica.com",
        "password_hash": get_password_hash("test123456"),
        "cell_phone": "1234567890",
        "address": "Calle Falsa 123, Ciudad, País",
        "status_clinic": "active",
        "domain_name": "clinicaprueba",
        "email_domain": "clinicaprueba.com",
        "subscription_status": "trial",
        "subscription_plan": "trial",
        "subscription_expires": None,
        "max_professionals": 2,
        "max_patients": 50,
        "whatsapp_session_name": "clinica-prueba",
        "n8n_folder_id": None,
        "n8n_folder_name": None,
        "professionals_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None,
        # Additional fields for subscription management
        "subscription_features": {
            "whatsapp_integration": True,
            "patient_history": True,
            "appointment_scheduling": False,
            "medical_records": False,
            "analytics_dashboard": False,
            "custom_branding": False,
            "api_access": False,
            "priority_support": False
        },
        "branding": {
            "clinic_title": "Clínica de Prueba",
            "clinic_subtitle": "Sistema de Gestión Médica",
            "logo_url": None,
            "primary_color": "#3B82F6",
            "secondary_color": "#1E40AF"
        }
    }
    
    # Insert test clinic
    result = await clinics_collection.insert_one(test_clinic)
    print(f"Test clinic created with ID: {result.inserted_id}")
    
    # Create a test patient
    patients_collection = db["patients"]
    test_patient = {
        "clinic_id": "test-clinic-001",
        "first_name": "Juan",
        "last_name": "Pérez",
        "dni": "12345678",
        "address": "Av. Principal 456",
        "cell_phone": "9876543210",
        "mutual": "OSDE",
        "email": "juan.perez@email.com",
        "birth_date": None,
        "status_patient": "active",
        "last_visit": None,
        "visit_history": [],
        "medical_files": [],
        "medical_notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await patients_collection.insert_one(test_patient)
    print(f"Test patient created with ID: {result.inserted_id}")
    
    # Create a test professional
    professionals_collection = db["professionals"]
    test_professional = {
        "clinic_id": "test-clinic-001",
        "first_name": "Dr. María",
        "last_name": "González",
        "speciality": "Medicina General",
        "email": "maria.gonzalez@clinicaprueba.com",
        "password_hash": get_password_hash("doctor123"),
        "phone": "5555555555",
        "status_professional": "active",
        "license_number": "MP12345",
        "is_active": True,
        "can_login": True,
        "permissions": ["view_patients", "edit_patients", "view_history"],
        "bio": "Médica general con 10 años de experiencia",
        "working_hours": "Lun-Vie 9:00-17:00",
        "consultation_fee": 50.0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    result = await professionals_collection.insert_one(test_professional)
    print(f"Test professional created with ID: {result.inserted_id}")
    
    print("\nTest data initialization complete!")
    print("Test clinic credentials:")
    print("   Email: test@clinica.com")  
    print("   Password: test123456")
    print("\nTest professional credentials:")
    print("   Email: maria.gonzalez@clinicaprueba.com")
    print("   Password: doctor123")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(init_test_clinic())