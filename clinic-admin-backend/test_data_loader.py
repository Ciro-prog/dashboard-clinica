#!/usr/bin/env python3
"""
Test Data Loader for Clinic Management System
Creates a test clinic with professionals and patients to validate functionality
"""

import asyncio
import sys
import os
from datetime import datetime, date, timedelta
import hashlib
from passlib.context import CryptContext

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Database configuration
MONGODB_URI = "mongodb://localhost:27017"
DATABASE_NAME = "clinica-dashboard"

async def init_database():
    """Initialize database connection"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    return db

async def hash_password(password: str) -> str:
    """Bcrypt password hashing to match backend authentication"""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

async def create_test_clinic(db):
    """Create a test clinic"""
    clinic_data = {
        "clinic_id": "TEST_CLINIC_2024",
        "name_clinic": "Clínica de Prueba Dr. García",
        "suscriber": "Dr. García",
        "email": "admin@clinicagarcia.com",
        "cell_phone": "+54 11 5555-0001",
        "address": "Av. Corrientes 1234, CABA, Argentina",
        "domain_name": "test-clinic",
        "password_hash": await hash_password("admin123"),
        "subscription_plan": "premium",
        "subscription_status": "active",
        "status_clinic": "active",
        "subscription_expires": datetime.utcnow() + timedelta(days=365),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "max_professionals": 10,
        "max_patients": 100,
        "configuration": {
            "timezone": "America/Argentina/Buenos_Aires",
            "currency": "ARS"
        }
    }
    
    clinics = db["clinics"]
    
    # Check if clinic already exists
    existing = await clinics.find_one({"clinic_id": clinic_data["clinic_id"]})
    if existing:
        print(f"WARNING - Clinic {clinic_data['clinic_id']} already exists, skipping creation")
        return clinic_data["clinic_id"]
    
    result = await clinics.insert_one(clinic_data)
    print(f"SUCCESS - Created test clinic: {clinic_data['clinic_id']}")
    return clinic_data["clinic_id"]

async def create_test_professionals(db, clinic_id: str):
    """Create test professionals"""
    professionals_data = [
        {
            "clinic_id": clinic_id,
            "first_name": "María",
            "last_name": "Fernández",
            "speciality": "Medicina General",
            "email": "maria.fernandez@clinicagarcia.com",
            "phone": "+54 11 4567-8901",
            "license_number": "MN123456",
            "status_professional": "active",
            "is_active": True,
            "can_login": True,
            "permissions": ["view_patients", "edit_patients", "view_history", "create_appointments"],
            "bio": "Médica clínica con 10 años de experiencia en medicina familiar",
            "working_hours": "Lun-Vie 8:00-16:00",
            "consultation_fee": 5000.0,
            "password_hash": await hash_password("medico123"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        },
        {
            "clinic_id": clinic_id,
            "first_name": "Carlos",
            "last_name": "Rodríguez", 
            "speciality": "Cardiología",
            "email": "carlos.rodriguez@clinicagarcia.com",
            "phone": "+54 11 4567-8902",
            "license_number": "MN789012",
            "status_professional": "active",
            "is_active": True,
            "can_login": True,
            "permissions": ["view_patients", "edit_patients", "view_history", "create_appointments", "advanced_diagnostics"],
            "bio": "Cardiólogo especialista con certificación en ecocardiografía",
            "working_hours": "Mar-Jue 9:00-17:00",
            "consultation_fee": 8000.0,
            "password_hash": await hash_password("cardio123"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
    ]
    
    professionals = db["professionals"]
    professional_ids = []
    
    for prof_data in professionals_data:
        # Check if professional already exists
        existing = await professionals.find_one({
            "clinic_id": clinic_id,
            "email": prof_data["email"]
        })
        
        if existing:
            print(f"WARNING - Professional {prof_data['email']} already exists, skipping")
            professional_ids.append(str(existing["_id"]))
            continue
        
        result = await professionals.insert_one(prof_data)
        professional_ids.append(str(result.inserted_id))
        print(f"SUCCESS - Created professional: {prof_data['first_name']} {prof_data['last_name']} ({prof_data['speciality']})")
    
    return professional_ids

async def create_test_patients(db, clinic_id: str, professional_ids: list):
    """Create test patients"""
    patients_data = [
        {
            "clinic_id": clinic_id,
            "first_name": "Ana",
            "last_name": "González",
            "dni": "12345678",
            "address": "Av. Corrientes 1234, CABA",
            "cell_phone": "+54 9 11 2345-6789",
            "mutual": "OSDE",
            "email": "ana.gonzalez@email.com",
            "birth_date": "1985-03-15",
            "status_patient": "active",
            "last_visit": None,  # Will be set when adding visit history
            "visit_history": [],
            "medical_files": [],
            "medical_notes": "Paciente con antecedentes de hipertensión leve",
            "shared_with": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "clinic_id": clinic_id,
            "first_name": "Roberto",
            "last_name": "Martínez",
            "dni": "87654321",
            "address": "Av. Santa Fe 5678, CABA",
            "cell_phone": "+54 9 11 8765-4321",
            "mutual": "Swiss Medical",
            "email": "roberto.martinez@email.com",
            "birth_date": "1978-11-22",
            "status_patient": "active",
            "last_visit": None,
            "visit_history": [],
            "medical_files": [],
            "medical_notes": "Paciente diabético tipo 2 en tratamiento",
            "shared_with": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "clinic_id": clinic_id,
            "first_name": "Laura",
            "last_name": "Silva",
            "dni": "11223344",
            "address": "Av. Cabildo 9999, CABA",
            "cell_phone": "+54 9 11 1122-3344",
            "mutual": "Galeno",
            "email": "laura.silva@email.com",
            "birth_date": "1992-07-08",
            "status_patient": "active",
            "last_visit": None,
            "visit_history": [],
            "medical_files": [],
            "medical_notes": "Paciente joven, consultas de rutina y controles preventivos",
            "shared_with": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    patients = db["patients"]
    patient_ids = []
    
    for patient_data in patients_data:
        # Check if patient already exists
        existing = await patients.find_one({
            "clinic_id": clinic_id,
            "dni": patient_data["dni"]
        })
        
        if existing:
            print(f"WARNING - Patient with DNI {patient_data['dni']} already exists, skipping")
            patient_ids.append(str(existing["_id"]))
            continue
        
        result = await patients.insert_one(patient_data)
        patient_ids.append(str(result.inserted_id))
        print(f"SUCCESS - Created patient: {patient_data['first_name']} {patient_data['last_name']} (DNI: {patient_data['dni']})")
    
    return patient_ids

async def create_sample_visits(db, patient_ids: list, professional_ids: list):
    """Create sample visit history for patients"""
    patients = db["patients"]
    
    # Sample visits
    visits_data = [
        {
            "patient_idx": 0,  # Ana González
            "professional_idx": 0,  # María Fernández
            "visit_date": datetime.utcnow() - timedelta(days=30),
            "diagnosis": "Control rutinario - Hipertensión leve",
            "treatment": "Continuar con medicación antihipertensiva",
            "notes": "Presión arterial controlada, paciente asintomática"
        },
        {
            "patient_idx": 0,  # Ana González
            "professional_idx": 1,  # Carlos Rodríguez (compartido)
            "visit_date": datetime.utcnow() - timedelta(days=15),
            "diagnosis": "Evaluación cardiológica",
            "treatment": "Ecocardiograma normal, continuar tratamiento actual",
            "notes": "Derivada por médico clínico para evaluación especializada"
        },
        {
            "patient_idx": 1,  # Roberto Martínez
            "professional_idx": 0,  # María Fernández
            "visit_date": datetime.utcnow() - timedelta(days=20),
            "diagnosis": "Control diabetológico",
            "treatment": "Ajuste de dosis de metformina",
            "notes": "HbA1c en 7.2%, requiere mejor control glucémico"
        },
        {
            "patient_idx": 2,  # Laura Silva
            "professional_idx": 0,  # María Fernández
            "visit_date": datetime.utcnow() - timedelta(days=10),
            "diagnosis": "Consulta preventiva - Ginecológica",
            "treatment": "Solicitar estudios de rutina",
            "notes": "Paciente asintomática, control preventivo anual"
        }
    ]
    
    # Get professional names
    professionals = db["professionals"]
    prof_data = []
    for prof_id in professional_ids:
        prof = await professionals.find_one({"_id": ObjectId(prof_id)})
        if prof:
            prof_data.append({
                "id": prof_id,
                "name": f"{prof['first_name']} {prof['last_name']}"
            })
    
    # Add visits to patients
    for visit in visits_data:
        patient_id = patient_ids[visit["patient_idx"]]
        prof_id = prof_data[visit["professional_idx"]]["id"]
        prof_name = prof_data[visit["professional_idx"]]["name"]
        
        visit_record = {
            "visit_date": visit["visit_date"],
            "professional_id": prof_id,
            "professional_name": prof_name,
            "diagnosis": visit["diagnosis"],
            "treatment": visit["treatment"],
            "notes": visit["notes"],
            "files": []
        }
        
        # Update patient with visit history and last_visit
        await patients.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$push": {"visit_history": visit_record},
                "$set": {
                    "last_visit": visit["visit_date"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"SUCCESS - Added visit for patient {visit['patient_idx']} with {prof_name}")

async def create_sharing_records(db, patient_ids: list, professional_ids: list):
    """Create patient sharing records between professionals"""
    patients = db["patients"]
    professionals = db["professionals"]
    
    # Share Ana González (patient 0) with Carlos Rodríguez (professional 1)
    patient_id = patient_ids[0]
    professional_id = professional_ids[1]
    
    # Get professional info
    prof = await professionals.find_one({"_id": ObjectId(professional_id)})
    if prof:
        share_record = {
            "professional_id": professional_id,
            "professional_name": f"{prof['first_name']} {prof['last_name']}",
            "shared_date": datetime.utcnow() - timedelta(days=20),
            "shared_by": "admin@clinicagarcia.com",
            "notes": "Derivación para evaluación cardiológica especializada"
        }
        
        await patients.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$push": {"shared_with": share_record},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        print(f"SUCCESS - Shared patient Ana Gonzalez with Dr. {prof['first_name']} {prof['last_name']}")

async def main():
    """Main execution function"""
    print("Hospital - Starting test data creation for Clinic Management System...")
    
    try:
        # Initialize database
        db = await init_database()
        print("Connected to database")
        
        # Create test clinic
        clinic_id = await create_test_clinic(db)
        
        # Create professionals
        professional_ids = await create_test_professionals(db, clinic_id)
        
        # Create patients
        patient_ids = await create_test_patients(db, clinic_id, professional_ids)
        
        # Create sample visits
        await create_sample_visits(db, patient_ids, professional_ids)
        
        # Create sharing records
        await create_sharing_records(db, patient_ids, professional_ids)
        
        print("\nSUCCESS - Test data creation completed successfully!")
        print(f"\nSummary:")
        print(f"   * Clinic: {clinic_id}")
        print(f"   * Professionals: {len(professional_ids)}")
        print(f"   * Patients: {len(patient_ids)}")
        print(f"   * Visit records: 4")
        print(f"   * Sharing records: 1")
        
        print(f"\nTest Credentials:")
        print(f"   * Maria Fernandez: maria.fernandez@clinicagarcia.com / medico123")
        print(f"   * Carlos Rodriguez: carlos.rodriguez@clinicagarcia.com / cardio123")
        
        print(f"\nTest Patient DNIs:")
        print(f"   * Ana Gonzalez: 12345678")
        print(f"   * Roberto Martinez: 87654321")
        print(f"   * Laura Silva: 11223344")
        
        print(f"\nTest with X-API-Key: test123456")
        print(f"   Example: curl -H \"X-API-Key: test123456\" http://localhost:8000/api/patients/search/by-dni?clinic_id={clinic_id}&dni=12345678")
        
    except Exception as e:
        print(f"ERROR - Error creating test data: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)