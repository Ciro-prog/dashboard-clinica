from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from ..core.database import get_collection
from ..core.uuid_generator import UUIDGenerator
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..auth.security import get_password_hash
from ..models.admin import AdminInDB
from ..models.clinic import (
    ClinicCreate, ClinicUpdate, ClinicResponse, ClinicInDB, 
    ClinicStatsResponse, SubscriptionUpdate
)

router = APIRouter(prefix="/clinics", tags=["Clinics Management"])


@router.get("/stats", response_model=ClinicStatsResponse)
async def get_clinics_stats(current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)):
    """Get clinic statistics"""
    clinics_collection = await get_collection("clinics")
    
    # Get counts
    total_clinics = await clinics_collection.count_documents({})
    active_clinics = await clinics_collection.count_documents({"status_clinic": "active"})
    trial_clinics = await clinics_collection.count_documents({"subscription_status": "trial"})
    expired_clinics = await clinics_collection.count_documents({"subscription_status": "expired"})
    
    # Calculate monthly revenue (simplified)
    pipeline = [
        {"$match": {"subscription_status": "active"}},
        {"$group": {
            "_id": "$subscription_plan",
            "count": {"$sum": 1}
        }}
    ]
    
    plans_revenue = {
        "basic": 29.99,
        "premium": 59.99,
        "enterprise": 99.99
    }
    
    revenue_monthly = 0.0
    async for plan_data in clinics_collection.aggregate(pipeline):
        plan_name = plan_data["_id"]
        count = plan_data["count"]
        if plan_name in plans_revenue:
            revenue_monthly += plans_revenue[plan_name] * count
    
    return ClinicStatsResponse(
        total_clinics=total_clinics,
        active_clinics=active_clinics,
        trial_clinics=trial_clinics,
        expired_clinics=expired_clinics,
        revenue_monthly=revenue_monthly
    )


@router.get("/public", response_model=List[ClinicResponse])
async def list_public_clinics(
    limit: int = Query(10, ge=1, le=50)
):
    """List active clinics (public endpoint - limited info)"""
    clinics_collection = await get_collection("clinics")
    
    # Only show active clinics publicly
    filter_dict = {"status_clinic": "active"}
    
    # Get clinics
    cursor = clinics_collection.find(filter_dict).limit(limit).sort("created_at", -1)
    clinics = []
    
    async for clinic in cursor:
        clinic_data = ClinicInDB.from_mongo(clinic)
        # Create public response with limited information
        public_clinic = ClinicResponse(**clinic_data.model_dump())
        clinics.append(public_clinic)
    
    return clinics


@router.get("/", response_model=List[ClinicResponse])
async def list_clinics(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(active|inactive|suspended)$"),
    subscription_status: Optional[str] = Query(None, pattern="^(trial|active|expired|cancelled)$"),
    search: Optional[str] = Query(None),
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """List clinics with filters"""
    clinics_collection = await get_collection("clinics")
    
    # Build filter
    filter_dict = {}
    if status:
        filter_dict["status_clinic"] = status
    if subscription_status:
        filter_dict["subscription_status"] = subscription_status
    if search:
        filter_dict["$or"] = [
            {"name_clinic": {"$regex": search, "$options": "i"}},
            {"suscriber": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"clinic_id": {"$regex": search, "$options": "i"}}
        ]
    
    # Get clinics
    cursor = clinics_collection.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
    clinics = []
    
    async for clinic in cursor:
        clinic_data = ClinicInDB.from_mongo(clinic)
        clinics.append(ClinicResponse(**clinic_data.model_dump()))
    
    return clinics


@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(clinic_id: str, current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)):
    """Get clinic by ID"""
    clinics_collection = await get_collection("clinics")
    
    # Try to find by ObjectId first, then by clinic_id
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    clinic_data = ClinicInDB.from_mongo(clinic)
    return ClinicResponse(**clinic_data.model_dump())


@router.post("/", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
async def create_clinic(clinic: ClinicCreate, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
    """Create new clinic with automatic unique ID generation"""
    clinics_collection = await get_collection("clinics")
    
    # Generate unique clinic_id if not provided or ensure uniqueness
    clinic_data = clinic.model_dump()
    if not clinic_data.get("clinic_id") or clinic_data["clinic_id"] == "":
        # Auto-generate based on clinic name
        clinic_data["clinic_id"] = UUIDGenerator.generate_clinic_id(clinic.name_clinic)
    
    # Ensure clinic_id is unique
    clinic_data["clinic_id"] = await UUIDGenerator.ensure_unique_clinic_id(clinic_data["clinic_id"])
    
    # Check if email already exists
    existing = await clinics_collection.find_one({"email": clinic.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create clinic
    clinic_data["password_hash"] = get_password_hash(clinic_data.pop("password"))
    clinic_data["created_at"] = datetime.utcnow()
    clinic_data["updated_at"] = datetime.utcnow()
    
    # Set WhatsApp session name if not provided
    if not clinic_data.get("whatsapp_session_name"):
        clinic_data["whatsapp_session_name"] = clinic.suscriber or clinic_data["clinic_id"]
    
    result = await clinics_collection.insert_one(clinic_data)
    clinic_data["_id"] = result.inserted_id
    
    clinic_db = ClinicInDB.from_mongo(clinic_data)
    return ClinicResponse(**clinic_db.model_dump())


@router.put("/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str, 
    clinic_update: ClinicUpdate, 
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update clinic"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Prepare update data
    update_data = {k: v for k, v in clinic_update.model_dump().items() if v is not None}
    
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update clinic
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": update_data}
    )
    
    # Get updated clinic
    updated_clinic = await clinics_collection.find_one({"_id": clinic["_id"]})
    clinic_db = ClinicInDB.from_mongo(updated_clinic)
    return ClinicResponse(**clinic_db.model_dump())


@router.patch("/{clinic_id}/subscription", response_model=ClinicResponse)
async def update_subscription(
    clinic_id: str,
    subscription: SubscriptionUpdate,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Update clinic subscription"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update subscription
    update_data = subscription.model_dump()
    update_data["updated_at"] = datetime.utcnow()
    
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": update_data}
    )
    
    # Get updated clinic
    updated_clinic = await clinics_collection.find_one({"_id": clinic["_id"]})
    clinic_db = ClinicInDB.from_mongo(updated_clinic)
    return ClinicResponse(**clinic_db.model_dump())


@router.patch("/{clinic_id}/status")
async def toggle_clinic_status(
    clinic_id: str,
    status_clinic: str = Query(..., pattern="^(active|inactive|suspended)$"),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Activate/deactivate clinic"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Update status
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "status_clinic": status_clinic,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": f"Clinic status updated to {status_clinic}"}


@router.delete("/{clinic_id}")
async def delete_clinic(clinic_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    """Delete clinic (soft delete - mark as inactive)"""
    clinics_collection = await get_collection("clinics")
    
    # Find clinic
    filter_dict = {}
    if ObjectId.is_valid(clinic_id):
        filter_dict = {"$or": [{"_id": ObjectId(clinic_id)}, {"clinic_id": clinic_id}]}
    else:
        filter_dict = {"clinic_id": clinic_id}
    
    clinic = await clinics_collection.find_one(filter_dict)
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinic not found"
        )
    
    # Soft delete
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "status_clinic": "inactive",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Clinic deactivated successfully"}