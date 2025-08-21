from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from bson import ObjectId
from ..core.database import get_collection
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..models.admin import AdminInDB
from ..models.patient import (
    PatientCreate, PatientUpdate, PatientResponse, PatientInDB,
    MedicalFile, VisitHistory
)

router = APIRouter(prefix="/patients", tags=["Patients Management"])


@router.get("/", response_model=List[PatientResponse])
async def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    clinic_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None, pattern="^(active|inactive|archived)$"),
    search: Optional[str] = Query(None),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """List patients with filters"""
    patients_collection = await get_collection("patients")
    
    # Build filter
    filter_dict = {}
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    if status:
        filter_dict["status_patient"] = status
    if search:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"dni": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"cell_phone": {"$regex": search, "$options": "i"}}
        ]
    
    # Get patients
    cursor = patients_collection.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
    patients = []
    
    async for patient in cursor:
        patient_data = PatientInDB.from_mongo(patient)
        patients.append(PatientResponse(**patient_data.model_dump()))
    
    return patients


@router.get("/search/by-dni", response_model=PatientResponse)
async def search_patient_by_dni(
    clinic_id: str = Query(..., description="ID de la clínica"),
    dni: str = Query(..., description="DNI del paciente a buscar"),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Buscar paciente por DNI en una clínica específica"""
    patients_collection = await get_collection("patients")
    
    # Buscar paciente por DNI y clinic_id
    patient = await patients_collection.find_one({
        "clinic_id": clinic_id,
        "dni": dni
    })
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró ningún paciente con DNI '{dni}' en la clínica especificada"
        )
    
    patient_data = PatientInDB.from_mongo(patient)
    return PatientResponse(**patient_data.model_dump())


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)):
    """Get patient by ID"""
    patients_collection = await get_collection("patients")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    patient_data = PatientInDB.from_mongo(patient)
    return PatientResponse(**patient_data.model_dump())


@router.get("/clinic/{clinic_id}", response_model=List[PatientResponse])
async def get_patients_by_clinic(
    clinic_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(active|inactive|archived)$"),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get patients by clinic ID"""
    patients_collection = await get_collection("patients")
    
    filter_dict = {"clinic_id": clinic_id}
    if status:
        filter_dict["status_patient"] = status
    
    cursor = patients_collection.find(filter_dict).skip(skip).limit(limit).sort("last_visit", -1)
    patients = []
    
    async for patient in cursor:
        patient_data = PatientInDB.from_mongo(patient)
        patients.append(PatientResponse(**patient_data.model_dump()))
    
    return patients


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Create new patient"""
    patients_collection = await get_collection("patients")
    
    # Check if DNI already exists in the same clinic
    existing = await patients_collection.find_one({
        "clinic_id": patient.clinic_id,
        "dni": patient.dni
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient with this DNI already exists in the clinic"
        )
    
    # Create patient
    patient_data = patient.model_dump()
    patient_data["created_at"] = datetime.utcnow()
    patient_data["updated_at"] = datetime.utcnow()
    patient_data["visit_history"] = []
    patient_data["medical_files"] = []
    patient_data["shared_with"] = []
    # last_visit should be None until patient has an actual visit
    
    result = await patients_collection.insert_one(patient_data)
    patient_data["_id"] = str(result.inserted_id)  # Convert ObjectId to string
    
    patient_db = PatientInDB.from_mongo(patient_data)
    return PatientResponse(**patient_db.model_dump())


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str, 
    patient_update: PatientUpdate, 
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Update patient"""
    patients_collection = await get_collection("patients")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Prepare update data - exclude last_visit from update (only updated through appointments)
    update_data = {k: v for k, v in patient_update.model_dump().items() if v is not None and k != 'last_visit'}
    update_data["updated_at"] = datetime.utcnow()
    
    # Check if DNI is being updated and doesn't conflict in the same clinic
    if "dni" in update_data:
        existing = await patients_collection.find_one({
            "clinic_id": patient["clinic_id"],
            "dni": update_data["dni"],
            "_id": {"$ne": ObjectId(patient_id)}
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A patient with this DNI already exists in the clinic"
            )
    
    # Update patient
    await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": update_data}
    )
    
    # Get updated patient
    updated_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    patient_db = PatientInDB.from_mongo(updated_patient)
    return PatientResponse(**patient_db.model_dump())


# Advanced Medical Records Search Endpoints
@router.post("/search/advanced", response_model=List[PatientResponse])
async def advanced_medical_records_search(
    search_params: dict,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Advanced search for medical records with multiple criteria
    """
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    
    # Build advanced filter
    filter_dict = {}
    
    # Clinic restriction
    clinic_id = search_params.get("clinic_id")
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    
    # Basic text search
    search_text = search_params.get("search_text")
    if search_text:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search_text, "$options": "i"}},
            {"last_name": {"$regex": search_text, "$options": "i"}},
            {"dni": {"$regex": search_text, "$options": "i"}},
            {"email": {"$regex": search_text, "$options": "i"}},
            {"cell_phone": {"$regex": search_text, "$options": "i"}},
            {"medical_notes": {"$regex": search_text, "$options": "i"}}
        ]
    
    # Status filter
    status = search_params.get("status")
    if status:
        filter_dict["status_patient"] = status
    
    try:
        # Execute search
        cursor = patients_collection.find(filter_dict).skip(skip).limit(limit)
        cursor = cursor.sort("last_visit", -1)
        
        patients = []
        async for patient in cursor:
            patient_data = PatientInDB.from_mongo(patient)
            patients.append(PatientResponse(**patient_data.model_dump()))
        
        return patients
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing advanced search: {str(e)}"
        )


@router.get("/analytics/medical-records/{clinic_id}")
async def get_medical_records_analytics(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get analytics about medical records for a clinic"""
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    documents_collection = await get_collection("documents")
    
    try:
        # Get patient statistics
        total_patients = await patients_collection.count_documents({"clinic_id": clinic_id})
        active_patients = await patients_collection.count_documents({
            "clinic_id": clinic_id, 
            "status_patient": "active"
        })
        
        # Get document statistics  
        total_documents = await documents_collection.count_documents({"clinic_id": clinic_id})
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_documents = await documents_collection.count_documents({
            "clinic_id": clinic_id,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "clinic_id": clinic_id,
            "patients": {
                "total": total_patients,
                "active": active_patients
            },
            "documents": {
                "total": total_documents,
                "recent_30_days": recent_documents
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )


@router.post("/{patient_id}/visit", response_model=PatientResponse)
async def add_visit_to_history(
    patient_id: str,
    visit_data: dict,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Add visit to patient history"""
    patients_collection = await get_collection("patients")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Create visit history entry
    visit = VisitHistory(
        visit_date=datetime.utcnow(),
        professional_id=visit_data.get("professional_id", ""),
        professional_name=visit_data.get("professional_name", ""),
        diagnosis=visit_data.get("diagnosis"),
        treatment=visit_data.get("treatment"),
        notes=visit_data.get("notes"),
        files=[]
    )
    
    # Update patient
    await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$push": {"visit_history": visit.model_dump()},
            "$set": {
                "last_visit": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated patient
    updated_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    patient_db = PatientInDB.from_mongo(updated_patient)
    return PatientResponse(**patient_db.model_dump())


# Advanced Medical Records Search Endpoints
@router.post("/search/advanced", response_model=List[PatientResponse])
async def advanced_medical_records_search(
    search_params: dict,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Advanced search for medical records with multiple criteria
    """
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    
    # Build advanced filter
    filter_dict = {}
    
    # Clinic restriction
    clinic_id = search_params.get("clinic_id")
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    
    # Basic text search
    search_text = search_params.get("search_text")
    if search_text:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search_text, "$options": "i"}},
            {"last_name": {"$regex": search_text, "$options": "i"}},
            {"dni": {"$regex": search_text, "$options": "i"}},
            {"email": {"$regex": search_text, "$options": "i"}},
            {"cell_phone": {"$regex": search_text, "$options": "i"}},
            {"medical_notes": {"$regex": search_text, "$options": "i"}}
        ]
    
    # Status filter
    status = search_params.get("status")
    if status:
        filter_dict["status_patient"] = status
    
    try:
        # Execute search
        cursor = patients_collection.find(filter_dict).skip(skip).limit(limit)
        cursor = cursor.sort("last_visit", -1)
        
        patients = []
        async for patient in cursor:
            patient_data = PatientInDB.from_mongo(patient)
            patients.append(PatientResponse(**patient_data.model_dump()))
        
        return patients
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing advanced search: {str(e)}"
        )


@router.get("/analytics/medical-records/{clinic_id}")
async def get_medical_records_analytics(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get analytics about medical records for a clinic"""
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    documents_collection = await get_collection("documents")
    
    try:
        # Get patient statistics
        total_patients = await patients_collection.count_documents({"clinic_id": clinic_id})
        active_patients = await patients_collection.count_documents({
            "clinic_id": clinic_id, 
            "status_patient": "active"
        })
        
        # Get document statistics  
        total_documents = await documents_collection.count_documents({"clinic_id": clinic_id})
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_documents = await documents_collection.count_documents({
            "clinic_id": clinic_id,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "clinic_id": clinic_id,
            "patients": {
                "total": total_patients,
                "active": active_patients
            },
            "documents": {
                "total": total_documents,
                "recent_30_days": recent_documents
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )


@router.post("/{patient_id}/documents")
async def upload_patient_document(
    patient_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Upload document for patient - redirects to documents API"""
    # Import here to avoid circular imports
    from .documents import upload_document
    return await upload_document(patient_id, file, document_type, description, current_admin)


@router.get("/{patient_id}/documents")
async def get_patient_documents_api(
    patient_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get patient documents - redirects to documents API"""  
    # Import here to avoid circular imports
    from .documents import get_patient_documents
    return await get_patient_documents(patient_id, current_admin)


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Delete patient (soft delete - mark as archived)"""
    patients_collection = await get_collection("patients")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Soft delete
    await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": {
            "status_patient": "archived",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Patient archived successfully"}


@router.get("/{patient_id}/history", response_model=List[dict])
async def get_patient_history(
    patient_id: str, 
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get patient visit history"""
    patients_collection = await get_collection("patients")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient.get("visit_history", [])


@router.patch("/{patient_id}/share", response_model=PatientResponse)
async def share_patient_with_professional(
    patient_id: str,
    professional_id: str = Query(..., description="ID del profesional con quien compartir"),
    notes: Optional[str] = Query(None, description="Notas sobre el compartir"),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Share patient information with a specific professional"""
    patients_collection = await get_collection("patients")
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    # Verify patient exists
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Verify professional exists and is in the same clinic
    professional = await professionals_collection.find_one({
        "_id": ObjectId(professional_id),
        "clinic_id": patient["clinic_id"],
        "status_professional": "active"
    })
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found or not active in the same clinic"
        )
    
    # Add sharing record to patient
    share_record = {
        "professional_id": professional_id,
        "professional_name": f"{professional['first_name']} {professional['last_name']}",
        "shared_date": datetime.utcnow(),
        "shared_by": current_admin.email,
        "notes": notes or f"Patient shared with {professional['first_name']} {professional['last_name']}"
    }
    
    # Update patient with sharing information
    await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$push": {"shared_with": share_record},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    # Get updated patient
    updated_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    patient_db = PatientInDB.from_mongo(updated_patient)
    return PatientResponse(**patient_db.model_dump())


# Advanced Medical Records Search Endpoints
@router.post("/search/advanced", response_model=List[PatientResponse])
async def advanced_medical_records_search(
    search_params: dict,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Advanced search for medical records with multiple criteria
    """
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    
    # Build advanced filter
    filter_dict = {}
    
    # Clinic restriction
    clinic_id = search_params.get("clinic_id")
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    
    # Basic text search
    search_text = search_params.get("search_text")
    if search_text:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search_text, "$options": "i"}},
            {"last_name": {"$regex": search_text, "$options": "i"}},
            {"dni": {"$regex": search_text, "$options": "i"}},
            {"email": {"$regex": search_text, "$options": "i"}},
            {"cell_phone": {"$regex": search_text, "$options": "i"}},
            {"medical_notes": {"$regex": search_text, "$options": "i"}}
        ]
    
    # Status filter
    status = search_params.get("status")
    if status:
        filter_dict["status_patient"] = status
    
    try:
        # Execute search
        cursor = patients_collection.find(filter_dict).skip(skip).limit(limit)
        cursor = cursor.sort("last_visit", -1)
        
        patients = []
        async for patient in cursor:
            patient_data = PatientInDB.from_mongo(patient)
            patients.append(PatientResponse(**patient_data.model_dump()))
        
        return patients
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing advanced search: {str(e)}"
        )


@router.get("/analytics/medical-records/{clinic_id}")
async def get_medical_records_analytics(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get analytics about medical records for a clinic"""
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    documents_collection = await get_collection("documents")
    
    try:
        # Get patient statistics
        total_patients = await patients_collection.count_documents({"clinic_id": clinic_id})
        active_patients = await patients_collection.count_documents({
            "clinic_id": clinic_id, 
            "status_patient": "active"
        })
        
        # Get document statistics  
        total_documents = await documents_collection.count_documents({"clinic_id": clinic_id})
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_documents = await documents_collection.count_documents({
            "clinic_id": clinic_id,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "clinic_id": clinic_id,
            "patients": {
                "total": total_patients,
                "active": active_patients
            },
            "documents": {
                "total": total_documents,
                "recent_30_days": recent_documents
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )


@router.post("/clinic/{clinic_id}/appointment", response_model=PatientResponse)
async def create_appointment_and_visit(
    clinic_id: str,
    patient_id: str = Query(..., description="ID del paciente"),
    professional_id: str = Query(..., description="ID del profesional"),
    appointment_date: datetime = Query(..., description="Fecha y hora de la cita"),
    diagnosis: Optional[str] = Query(None, description="Diagnóstico"),
    treatment: Optional[str] = Query(None, description="Tratamiento"),
    notes: Optional[str] = Query(None, description="Notas de la visita"),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Create appointment and add visit to patient history"""
    patients_collection = await get_collection("patients")
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    # Verify patient exists and belongs to clinic
    patient = await patients_collection.find_one({
        "_id": ObjectId(patient_id),
        "clinic_id": clinic_id
    })
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found in specified clinic"
        )
    
    # Verify professional exists and belongs to clinic
    professional = await professionals_collection.find_one({
        "_id": ObjectId(professional_id),
        "clinic_id": clinic_id,
        "status_professional": "active"
    })
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found or not active in specified clinic"
        )
    
    # Create visit history entry
    visit = VisitHistory(
        visit_date=appointment_date,
        professional_id=professional_id,
        professional_name=f"{professional['first_name']} {professional['last_name']}",
        diagnosis=diagnosis,
        treatment=treatment,
        notes=notes,
        files=[]
    )
    
    # Update patient with visit and last_visit
    await patients_collection.update_one(
        {"_id": ObjectId(patient_id)},
        {
            "$push": {"visit_history": visit.model_dump()},
            "$set": {
                "last_visit": appointment_date,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Get updated patient
    updated_patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    patient_db = PatientInDB.from_mongo(updated_patient)
    return PatientResponse(**patient_db.model_dump())


# Advanced Medical Records Search Endpoints
@router.post("/search/advanced", response_model=List[PatientResponse])
async def advanced_medical_records_search(
    search_params: dict,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Advanced search for medical records with multiple criteria
    """
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    
    # Build advanced filter
    filter_dict = {}
    
    # Clinic restriction
    clinic_id = search_params.get("clinic_id")
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    
    # Basic text search
    search_text = search_params.get("search_text")
    if search_text:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search_text, "$options": "i"}},
            {"last_name": {"$regex": search_text, "$options": "i"}},
            {"dni": {"$regex": search_text, "$options": "i"}},
            {"email": {"$regex": search_text, "$options": "i"}},
            {"cell_phone": {"$regex": search_text, "$options": "i"}},
            {"medical_notes": {"$regex": search_text, "$options": "i"}}
        ]
    
    # Status filter
    status = search_params.get("status")
    if status:
        filter_dict["status_patient"] = status
    
    try:
        # Execute search
        cursor = patients_collection.find(filter_dict).skip(skip).limit(limit)
        cursor = cursor.sort("last_visit", -1)
        
        patients = []
        async for patient in cursor:
            patient_data = PatientInDB.from_mongo(patient)
            patients.append(PatientResponse(**patient_data.model_dump()))
        
        return patients
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing advanced search: {str(e)}"
        )


@router.get("/analytics/medical-records/{clinic_id}")
async def get_medical_records_analytics(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get analytics about medical records for a clinic"""
    from datetime import timedelta
    patients_collection = await get_collection("patients")
    documents_collection = await get_collection("documents")
    
    try:
        # Get patient statistics
        total_patients = await patients_collection.count_documents({"clinic_id": clinic_id})
        active_patients = await patients_collection.count_documents({
            "clinic_id": clinic_id, 
            "status_patient": "active"
        })
        
        # Get document statistics  
        total_documents = await documents_collection.count_documents({"clinic_id": clinic_id})
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_documents = await documents_collection.count_documents({
            "clinic_id": clinic_id,
            "created_at": {"$gte": thirty_days_ago}
        })
        
        return {
            "clinic_id": clinic_id,
            "patients": {
                "total": total_patients,
                "active": active_patients
            },
            "documents": {
                "total": total_documents,
                "recent_30_days": recent_documents
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )