import os
import uuid
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse, RedirectResponse
from bson import ObjectId
from ..core.database import get_collection
from ..core.storage_service import get_storage_service
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..models.admin import AdminInDB
from ..models.document import DocumentCreate, DocumentResponse, DocumentInDB, PatientShare, PatientShareResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Document Management"])

# File upload configuration
UPLOAD_DIR = "uploads"  # Legacy fallback
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
    "document": [".pdf", ".doc", ".docx", ".txt"],
    "medical": [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]
}

# Ensure upload directory exists for fallback
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize storage service (MinIO by default)
storage_service = get_storage_service(use_minio=True)


@router.post("/patients/{patient_id}/upload", response_model=DocumentResponse)
async def upload_document(
    patient_id: str,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Upload a document for a patient using MinIO storage"""
    
    # Validate patient_id
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format"
        )
    
    # Check if patient exists and get clinic_id
    patients_collection = await get_collection("patients")
    patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    clinic_id = patient.get("clinic_id")
    if not clinic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient does not have a valid clinic ID"
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
    
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Create file-like object for storage service
        file_data = io.BytesIO(content)
        
        # Upload to storage service (MinIO)
        upload_result = await storage_service.upload_medical_document(
            clinic_id=clinic_id,
            patient_id=patient_id,
            file_data=file_data,
            filename=file.filename,
            file_size=file_size,
            document_type=document_type,
            description=description,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Create document record in database
        documents_collection = await get_collection("documents")
        
        document_data = {
            "patient_id": patient_id,
            "clinic_id": clinic_id,
            "file_name": file.filename,
            "file_type": file.content_type or "unknown",
            "file_size": file_size,
            "document_type": document_type,
            "description": description,
            "uploaded_by": current_admin.admin_id,
            "created_at": datetime.utcnow(),
            # MinIO-specific fields
            "storage_type": upload_result.get("storage_type", "minio"),
            "bucket_name": upload_result.get("bucket_name"),
            "object_name": upload_result.get("object_name"),
            "document_id": upload_result.get("document_id"),
            "etag": upload_result.get("etag"),
            # Legacy compatibility
            "file_path": upload_result.get("object_name", upload_result.get("file_path"))
        }
        
        result = await documents_collection.insert_one(document_data)
        document_data["_id"] = str(result.inserted_id)
        
        document_db = DocumentInDB.from_mongo(document_data)
        
        logger.info(f"✅ Document uploaded: {file.filename} for patient {patient_id} in clinic {clinic_id}")
        
        return DocumentResponse(**document_db.model_dump())
        
    except Exception as e:
        logger.error(f"❌ Document upload failed: {str(e)}")
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
    """Download a document (MinIO or legacy local)"""
    
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
        storage_type = document.get("storage_type", "local")
        
        if storage_type == "minio":
            # MinIO storage - generate presigned URL and redirect
            clinic_id = document.get("clinic_id")
            object_name = document.get("object_name") or document.get("file_path")
            
            if not clinic_id or not object_name:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing storage information for MinIO document"
                )
            
            download_url = await storage_service.get_document_download_url(clinic_id, object_name)
            
            # Return redirect to presigned URL
            return RedirectResponse(url=download_url)
            
        else:
            # Legacy local storage
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
            
    except Exception as e:
        logger.error(f"❌ Document download failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading document: {str(e)}"
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Delete a document (MinIO or legacy local)"""
    
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
        storage_type = document.get("storage_type", "local")
        
        if storage_type == "minio":
            # MinIO storage
            clinic_id = document.get("clinic_id")
            object_name = document.get("object_name") or document.get("file_path")
            
            if clinic_id and object_name:
                success = await storage_service.delete_medical_document(clinic_id, object_name)
                if not success:
                    logger.warning(f"⚠️ Failed to delete file from MinIO: {object_name}")
            
        else:
            # Legacy local storage
            file_path = document["file_path"]
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Delete document record from database
        await documents_collection.delete_one({"_id": ObjectId(document_id)})
        
        logger.info(f"✅ Document deleted: {document.get('file_name')} (ID: {document_id})")
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        logger.error(f"❌ Document deletion failed: {str(e)}")
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


# Storage management endpoints
@router.get("/storage/stats/{clinic_id}")
async def get_clinic_storage_stats(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get storage statistics for a clinic"""
    try:
        stats = await storage_service.get_clinic_storage_statistics(clinic_id)
        
        # Add document count from database
        documents_collection = await get_collection("documents")
        doc_count = await documents_collection.count_documents({"clinic_id": clinic_id})
        
        stats["documents_in_database"] = doc_count
        stats["storage_service_type"] = storage_service.get_storage_type()
        
        return {
            "clinic_id": clinic_id,
            "storage_stats": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get storage stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting storage statistics: {str(e)}"
        )


@router.post("/storage/migrate/{clinic_id}")
async def migrate_clinic_documents_to_minio(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Migrate clinic documents from local storage to MinIO"""
    try:
        documents_collection = await get_collection("documents")
        
        # Find all local documents for clinic
        local_docs = await documents_collection.find({
            "clinic_id": clinic_id,
            "$or": [
                {"storage_type": "local"},
                {"storage_type": {"$exists": False}}
            ]
        }).to_list(None)
        
        if not local_docs:
            return {
                "message": "No local documents found for migration",
                "migrated_count": 0
            }
        
        migrated_count = 0
        errors = []
        
        for doc in local_docs:
            try:
                file_path = doc.get("file_path")
                if not file_path or not os.path.exists(file_path):
                    errors.append(f"File not found: {file_path}")
                    continue
                
                # Read local file
                with open(file_path, "rb") as f:
                    file_data = io.BytesIO(f.read())
                    file_size = len(file_data.getvalue())
                    file_data.seek(0)
                
                # Upload to MinIO
                upload_result = await storage_service.upload_medical_document(
                    clinic_id=clinic_id,
                    patient_id=doc["patient_id"],
                    file_data=file_data,
                    filename=doc["file_name"],
                    file_size=file_size,
                    document_type=doc.get("document_type", "medical_record"),
                    description=doc.get("description"),
                    content_type=doc.get("file_type", "application/octet-stream")
                )
                
                # Update document record
                await documents_collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {
                        "storage_type": "minio",
                        "bucket_name": upload_result.get("bucket_name"),
                        "object_name": upload_result.get("object_name"),
                        "document_id": upload_result.get("document_id"),
                        "etag": upload_result.get("etag"),
                        "migrated_at": datetime.utcnow()
                    }}
                )
                
                # Delete local file after successful migration
                os.remove(file_path)
                migrated_count += 1
                
            except Exception as e:
                errors.append(f"Failed to migrate {doc.get('file_name', 'unknown')}: {str(e)}")
                continue
        
        return {
            "message": f"Migration completed for clinic {clinic_id}",
            "migrated_count": migrated_count,
            "total_documents": len(local_docs),
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during migration: {str(e)}"
        )