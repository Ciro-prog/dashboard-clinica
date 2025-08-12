from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from ..core.database import get_collection
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..models.admin import AdminInDB
from ..models.professional import (
    ProfessionalCreate, ProfessionalUpdate, ProfessionalResponse, ProfessionalInDB
)

router = APIRouter(prefix="/professionals", tags=["Professionals Management"])


@router.get("/", response_model=List[ProfessionalResponse])
async def list_professionals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    clinic_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None, pattern="^(active|inactive|vacation)$"),
    speciality: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """List professionals with filters"""
    professionals_collection = await get_collection("professionals")
    
    # Build filter
    filter_dict = {}
    if clinic_id:
        filter_dict["clinic_id"] = clinic_id
    if status:
        filter_dict["status_professional"] = status
    if speciality:
        filter_dict["speciality"] = {"$regex": speciality, "$options": "i"}
    if search:
        filter_dict["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"speciality": {"$regex": search, "$options": "i"}},
            {"license_number": {"$regex": search, "$options": "i"}}
        ]
    
    # Get professionals
    cursor = professionals_collection.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
    professionals = []
    
    async for professional in cursor:
        professional_data = ProfessionalInDB.from_mongo(professional)
        professionals.append(ProfessionalResponse(**professional_data.model_dump()))
    
    return professionals


@router.get("/{professional_id}", response_model=ProfessionalResponse)
async def get_professional(professional_id: str, current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)):
    """Get professional by ID"""
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    professional = await professionals_collection.find_one({"_id": ObjectId(professional_id)})
    
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    professional_data = ProfessionalInDB.from_mongo(professional)
    return ProfessionalResponse(**professional_data.model_dump())


@router.get("/clinic/{clinic_id}", response_model=List[ProfessionalResponse])
async def get_professionals_by_clinic(
    clinic_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(active|inactive|vacation)$"),
    speciality: Optional[str] = Query(None),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get professionals by clinic ID"""
    professionals_collection = await get_collection("professionals")
    
    filter_dict = {"clinic_id": clinic_id}
    if status:
        filter_dict["status_professional"] = status
    if speciality:
        filter_dict["speciality"] = {"$regex": speciality, "$options": "i"}
    
    cursor = professionals_collection.find(filter_dict).skip(skip).limit(limit).sort("first_name", 1)
    professionals = []
    
    async for professional in cursor:
        professional_data = ProfessionalInDB.from_mongo(professional)
        professionals.append(ProfessionalResponse(**professional_data.model_dump()))
    
    return professionals


@router.post("/", response_model=ProfessionalResponse, status_code=status.HTTP_201_CREATED)
async def create_professional(professional: ProfessionalCreate, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Create new professional"""
    professionals_collection = await get_collection("professionals")
    clinics_collection = await get_collection("clinics")
    
    # Verify clinic exists
    clinic = await clinics_collection.find_one({"clinic_id": professional.clinic_id})
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clinic not found"
        )
    
    # Check clinic's professional limit
    current_professionals = await professionals_collection.count_documents({
        "clinic_id": professional.clinic_id,
        "status_professional": {"$ne": "inactive"}
    })
    
    max_professionals = clinic.get("max_professionals", 5)
    if current_professionals >= max_professionals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Clinic has reached maximum number of professionals ({max_professionals})"
        )
    
    # Check if email already exists in the same clinic
    existing = await professionals_collection.find_one({
        "clinic_id": professional.clinic_id,
        "email": professional.email
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Professional with this email already exists in the clinic"
        )
    
    # Check if license number already exists (if provided)
    if professional.license_number:
        existing_license = await professionals_collection.find_one({
            "license_number": professional.license_number
        })
        
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professional with this license number already exists"
            )
    
    # Create professional
    professional_data = professional.model_dump()
    professional_data["created_at"] = datetime.utcnow()
    professional_data["updated_at"] = datetime.utcnow()
    
    result = await professionals_collection.insert_one(professional_data)
    professional_data["_id"] = result.inserted_id
    
    professional_db = ProfessionalInDB.from_mongo(professional_data)
    return ProfessionalResponse(**professional_db.model_dump())


@router.put("/{professional_id}", response_model=ProfessionalResponse)
async def update_professional(
    professional_id: str, 
    professional_update: ProfessionalUpdate, 
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update professional"""
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    professional = await professionals_collection.find_one({"_id": ObjectId(professional_id)})
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in professional_update.model_dump().items() if v is not None}
    
    # Check if email is being updated and doesn't conflict
    if "email" in update_data:
        existing = await professionals_collection.find_one({
            "clinic_id": professional["clinic_id"],
            "email": update_data["email"],
            "_id": {"$ne": ObjectId(professional_id)}
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professional with this email already exists in the clinic"
            )
    
    # Check if license number is being updated and doesn't conflict
    if "license_number" in update_data and update_data["license_number"]:
        existing_license = await professionals_collection.find_one({
            "license_number": update_data["license_number"],
            "_id": {"$ne": ObjectId(professional_id)}
        })
        
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professional with this license number already exists"
            )
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update professional
    await professionals_collection.update_one(
        {"_id": ObjectId(professional_id)},
        {"$set": update_data}
    )
    
    # Get updated professional
    updated_professional = await professionals_collection.find_one({"_id": ObjectId(professional_id)})
    professional_db = ProfessionalInDB.from_mongo(updated_professional)
    return ProfessionalResponse(**professional_db.model_dump())


@router.patch("/{professional_id}/status")
async def toggle_professional_status(
    professional_id: str,
    status_professional: str = Query(..., pattern="^(active|inactive|vacation)$"),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Change professional status"""
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    professional = await professionals_collection.find_one({"_id": ObjectId(professional_id)})
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Update status
    await professionals_collection.update_one(
        {"_id": ObjectId(professional_id)},
        {"$set": {
            "status_professional": status_professional,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": f"Professional status updated to {status_professional}"}


@router.delete("/{professional_id}")
async def delete_professional(professional_id: str, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Delete professional (soft delete - mark as inactive)"""
    professionals_collection = await get_collection("professionals")
    
    if not ObjectId.is_valid(professional_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid professional ID format"
        )
    
    professional = await professionals_collection.find_one({"_id": ObjectId(professional_id)})
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found"
        )
    
    # Soft delete
    await professionals_collection.update_one(
        {"_id": ObjectId(professional_id)},
        {"$set": {
            "status_professional": "inactive",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Professional deactivated successfully"}


@router.get("/clinic/{clinic_id}/stats")
async def get_clinic_professionals_stats(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get professionals statistics for a clinic"""
    professionals_collection = await get_collection("professionals")
    
    # Get counts by status
    pipeline = [
        {"$match": {"clinic_id": clinic_id}},
        {"$group": {
            "_id": "$status_professional",
            "count": {"$sum": 1}
        }}
    ]
    
    stats = {
        "total": 0,
        "active": 0,
        "inactive": 0,
        "vacation": 0,
        "by_speciality": {}
    }
    
    async for status_data in professionals_collection.aggregate(pipeline):
        status_name = status_data["_id"]
        count = status_data["count"]
        stats["total"] += count
        stats[status_name] = count
    
    # Get count by speciality
    speciality_pipeline = [
        {"$match": {"clinic_id": clinic_id, "status_professional": "active"}},
        {"$group": {
            "_id": "$speciality",
            "count": {"$sum": 1}
        }}
    ]
    
    async for spec_data in professionals_collection.aggregate(speciality_pipeline):
        speciality = spec_data["_id"]
        count = spec_data["count"]
        stats["by_speciality"][speciality] = count
    
    return stats