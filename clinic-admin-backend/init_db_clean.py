#!/usr/bin/env python3
"""
Database initialization script
Creates default admin user and sample clinic for testing
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.auth.security import get_password_hash

async def init_database():
    """Initialize database with default data"""
    print(">> Connecting to MongoDB...")
    
    # Connect to database
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print(f">> Connected to database: {settings.database_name}")
        
        # Create collections and indexes
        await create_collections_and_indexes(db)
        
        # Create default admin
        await create_default_admin(db)
        
        # Create sample clinic
        await create_sample_clinic(db)
        
        # Create sample professional
        await create_sample_professional(db)
        
        # Create sample patient
        await create_sample_patient(db)
        
        print(">> Database initialization completed successfully!")
        
    except Exception as e:
        print(f"ERROR: Error initializing database: {e}")
        raise
    finally:
        client.close()

async def create_collections_and_indexes(db):
    """Create collections and necessary indexes"""
    print(">> Creating collections and indexes...")
    
    # Admins collection
    await db.admins.create_index("username", unique=True)
    await db.admins.create_index("email", unique=True)
    
    # Clinics collection
    await db.clinics.create_index("clinic_id", unique=True)
    await db.clinics.create_index("email", unique=True)
    await db.clinics.create_index("status_clinic")
    
    # Patients collection
    await db.patients.create_index([("clinic_id", 1), ("dni", 1)], unique=True)
    await db.patients.create_index("clinic_id")
    await db.patients.create_index("status_patient")
    
    # Professionals collection
    await db.professionals.create_index([("clinic_id", 1), ("email", 1)], unique=True)
    await db.professionals.create_index("clinic_id")
    await db.professionals.create_index("status_professional")
    await db.professionals.create_index("license_number", unique=True, sparse=True)
    
    print(">> Collections and indexes created")

async def create_default_admin(db):
    """Create default admin user"""
    print(">> Creating default admin...")
    
    # Check if admin already exists
    existing_admin = await db.admins.find_one({"username": "admin"})
    
    if existing_admin:
        print("INFO: Default admin already exists")
        return
    
    # Create default admin
    admin_data = {
        "username": "admin",
        "email": "admin@clinica-dashboard.com",
        "password_hash": get_password_hash("admin123"),
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    result = await db.admins.insert_one(admin_data)
    print(f">> Created default admin with ID: {result.inserted_id}")
    print("   Username: admin")
    print("   Email: admin@clinica-dashboard.com")
    print("   Password: admin123")
    print("   Role: super_admin")

async def create_sample_clinic(db):
    """Create sample clinic for testing"""
    print(">> Creating sample clinic...")
    
    # Check if clinic already exists
    existing_clinic = await db.clinics.find_one({"clinic_id": "clinica-demo"})
    
    if existing_clinic:
        print("INFO: Sample clinic already exists")
        return
    
    # Create sample clinic
    clinic_data = {
        "clinic_id": "clinica-demo",
        "name_clinic": "Clinica Demo",
        "suscriber": "demo-user",
        "email": "demo@clinica-dashboard.com",
        "password_hash": get_password_hash("demo123"),
        "cell_phone": "+54911234567",
        "address": "Av. Demo 123, Ciudad Demo",
        "status_clinic": "active",
        "subscription_status": "active",
        "subscription_plan": "premium",
        "subscription_expires": None,
        "max_professionals": 10,
        "max_patients": 500,
        "whatsapp_session_name": "demo-user",
        "n8n_folder_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    result = await db.clinics.insert_one(clinic_data)
    print(f">> Created sample clinic with ID: {result.inserted_id}")
    print("   Clinic ID: clinica-demo")
    print("   Email: demo@clinica-dashboard.com")
    print("   Password: demo123")
    print("   Status: active")

async def create_sample_professional(db):
    """Create sample professional for testing"""
    print(">> Creating sample professional...")
    
    # Check if professional already exists
    existing_prof = await db.professionals.find_one({
        "clinic_id": "clinica-demo",
        "email": "doctor@clinica-dashboard.com"
    })
    
    if existing_prof:
        print("INFO: Sample professional already exists")
        return
    
    # Create sample professional
    professional_data = {
        "clinic_id": "clinica-demo",
        "first_name": "Dr. Juan",
        "last_name": "Perez",
        "speciality": "Medicina General",
        "email": "doctor@clinica-dashboard.com",
        "phone": "+54911234568",
        "status_professional": "active",
        "license_number": "MP-12345",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.professionals.insert_one(professional_data)
    print(f">> Created sample professional with ID: {result.inserted_id}")

async def create_sample_patient(db):
    """Create sample patient for testing"""
    print(">> Creating sample patient...")
    
    # Check if patient already exists
    existing_patient = await db.patients.find_one({
        "clinic_id": "clinica-demo",
        "dni": "12345678"
    })
    
    if existing_patient:
        print("INFO: Sample patient already exists")
        return
    
    # Create sample patient
    patient_data = {
        "clinic_id": "clinica-demo",
        "first_name": "Maria",
        "last_name": "Gonzalez",
        "dni": "12345678",
        "address": "Calle Ejemplo 456, Ciudad Demo",
        "cell_phone": "+54911234569",
        "mutual": "OSDE",
        "email": "maria.gonzalez@example.com",
        "birth_date": None,
        "status_patient": "active",
        "last_visit": None,
        "visit_history": [],
        "medical_files": [],
        "medical_notes": "Paciente de ejemplo para testing",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.patients.insert_one(patient_data)
    print(f">> Created sample patient with ID: {result.inserted_id}")

if __name__ == "__main__":
    print(">> Starting database initialization...")
    print(f"Database: {settings.database_name}")
    print(f"MongoDB URL: {settings.mongodb_url}")
    print("=" * 50)
    
    try:
        asyncio.run(init_database())
        print("=" * 50)
        print(">> Database initialization completed!")
        print("\nINFO: Default credentials:")
        print("   Admin: admin@clinica-dashboard.com / admin123")
        print("   Clinic: demo@clinica-dashboard.com / demo123")
        print("\n>> You can now start the API with: python main.py")
    except KeyboardInterrupt:
        print("\nERROR: Initialization cancelled by user")
    except Exception as e:
        print(f"\nERROR: Initialization failed: {e}")
        exit(1)