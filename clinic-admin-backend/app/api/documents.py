import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from bson import ObjectId
from ..core.database import get_collection
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..models.admin import AdminInDB
from ..models.document import DocumentCreate, DocumentResponse, DocumentInDB, PatientShare, PatientShareResponse

router = APIRouter(prefix="/documents", tags=["Document Management"])

# File upload configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
    "document": [".pdf", ".doc", ".docx", ".txt"],
    "medical": [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]
}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/patients/{patient_id}/upload", response_model=DocumentResponse)
async def upload_document(
    patient_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Upload a document for a patient"""
    
    # Validate patient_id
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists
    patients_collection = await get_collection("patients")
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    # Validate document type
    if document_type not in ["medical_record", "lab_result", "image", "prescription", "other"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type"
        )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create directory structure
    patient_dir = os.path.join(UPLOAD_DIR, "patients", patient_id)
    os.makedirs(patient_dir, exist_ok=True)
    
    file_path = os.path.join(patient_dir, unique_filename)
    
    try:
        # Save file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create document record
        documents_collection = await get_collection("documents")
        
        document_data = {
            "patient_id": patient_id,
            "file_name": file.filename,
            "file_type": file.content_type or "unknown",
            "file_size": len(content),
            "file_path": file_path,
            "document_type": document_type,
            "description": description,
            "uploaded_by": current_admin.admin_id,
            "created_at": datetime.utcnow()
        }
        
        result = await documents_collection.insert_one(document_data)
        document_data["_id"] = result.inserted_id
        
        document_db = DocumentInDB.from_mongo(document_data)
        return DocumentResponse(**document_db.model_dump())
        
    except Exception as e:
        # Clean up file if database insert fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/patients/{patient_id}/documents", response_model=List[DocumentResponse])
async def get_patient_documents(
    patient_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get all documents for a patient"""
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    documents_collection = await get_collection("documents")
    cursor = documents_collection.find({"patient_id": patient_id}).sort("created_at", -1)
    
    documents = []
    async for doc in cursor:
        document_db = DocumentInDB.from_mongo(doc)
        documents.append(DocumentResponse(**document_db.model_dump()))
    
    return documents


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Download a document"""
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID format"
        )
    
    documents_collection = await get_collection("documents")
    document = await documents_collection.find_one({"_id": ObjectId(document_id)})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    file_path = document["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=file_path,
        filename=document["file_name"],
        media_type=document["file_type"]
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Delete a document"""
    
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document ID format"
        )
    
    documents_collection = await get_collection("documents")
    document = await documents_collection.find_one({"_id": ObjectId(document_id)})
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        # Delete file from disk
        file_path = document["file_path"]
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete document record
        await documents_collection.delete_one({"_id": ObjectId(document_id)})
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )


# Patient sharing endpoints
@router.post("/patients/{patient_id}/share")
async def share_patient(
    patient_id: str,
    shared_with: str,
    permissions: str = "read",
    notes: Optional[str] = None,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Share patient data with another professional"""
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Validate permissions
    if permissions not in ["read", "write"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid permissions. Must be 'read' or 'write'"
        )
    
    # Check if patient exists
    patients_collection = await get_collection("patients")
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check if target professional exists
    professionals_collection = await get_collection("professionals")
    target_professional = await professionals_collection.find_one({"_id": ObjectId(shared_with)})
    
    if not target_professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target professional not found"
        )
    
    # Check if both professionals belong to the same clinic
    current_professional = await professionals_collection.find_one({"admin_id": current_admin.admin_id})
    
    if not current_professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Current professional profile not found"
        )
    
    if current_professional["clinic_id"] != target_professional["clinic_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only share patients with professionals from the same clinic"
        )
    
    # Create or update share record
    shares_collection = await get_collection("patient_shares")
    
    share_data = {
        "patient_id": patient_id,
        "shared_by": current_professional["_id"],
        "shared_with": ObjectId(shared_with),
        "permissions": permissions,
        "shared_at": datetime.utcnow(),
        "notes": notes
    }
    
    # Check if share already exists and update, otherwise create
    existing_share = await shares_collection.find_one({
        "patient_id": patient_id,
        "shared_by": current_professional["_id"],
        "shared_with": ObjectId(shared_with)
    })
    
    if existing_share:
        await shares_collection.update_one(
            {"_id": existing_share["_id"]},
            {"$set": {
                "permissions": permissions,
                "shared_at": datetime.utcnow(),
                "notes": notes
            }}
        )
        return {"message": "Patient sharing updated successfully"}
    else:
        await shares_collection.insert_one(share_data)
        return {"message": "Patient shared successfully"}


@router.get("/patients/shared-with-me", response_model=List[PatientShareResponse])
async def get_patients_shared_with_me(
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get patients that have been shared with the current professional"""
    
    # Get current professional
    professionals_collection = await get_collection("professionals")
    current_professional = await professionals_collection.find_one({"admin_id": current_admin.admin_id})
    
    if not current_professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional profile not found"
        )
    
    # Get shares
    shares_collection = await get_collection("patient_shares")
    patients_collection = await get_collection("patients")
    
    cursor = shares_collection.find({"shared_with": current_professional["_id"]}).sort("shared_at", -1)
    
    shared_patients = []
    async for share in cursor:
        # Get patient details
        patient = await patients_collection.find_one({"_id": ObjectId(share["patient_id"])})
        
        # Get sharing professional details
        sharing_professional = await professionals_collection.find_one({"_id": share["shared_by"]})
        
        if patient and sharing_professional:
            share_response = PatientShareResponse(
                _id=str(share["_id"]),
                patient_id=share["patient_id"],
                patient_name=f"{patient['first_name']} {patient['last_name']}",
                shared_by=str(share["shared_by"]),
                shared_by_name=f"{sharing_professional['first_name']} {sharing_professional['last_name']}",
                shared_with=str(share["shared_with"]),
                shared_with_name=f"{current_professional['first_name']} {current_professional['last_name']}",
                permissions=share["permissions"],
                shared_at=share["shared_at"],
                expires_at=share.get("expires_at"),
                notes=share.get("notes")
            )
            shared_patients.append(share_response)
    
    return shared_patients


@router.delete("/patients/{patient_id}/share/{professional_id}")
async def revoke_patient_share(
    patient_id: str,
    professional_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Revoke patient sharing"""
    
    if not ObjectId.is_valid(patient_id) or not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Get current professional
    professionals_collection = await get_collection("professionals")
    current_professional = await professionals_collection.find_one({"admin_id": current_admin.admin_id})
    
    if not current_professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional profile not found"
        )
    
    # Delete share record
    shares_collection = await get_collection("patient_shares")
    result = await shares_collection.delete_one({
        "patient_id": patient_id,
        "shared_by": current_professional["_id"],
        "shared_with": ObjectId(professional_id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share record not found"
        )
    
    return {"message": "Patient sharing revoked successfully"}