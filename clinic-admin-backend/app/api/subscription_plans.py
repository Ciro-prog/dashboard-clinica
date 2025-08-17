from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from ..core.database import get_collection
from ..core.uuid_generator import UUIDGenerator
from ..auth.dependencies import get_current_admin, get_super_admin, get_current_admin_hybrid, get_super_admin_hybrid
from ..models.admin import AdminInDB
from ..models.subscription_plan import (
    SubscriptionPlanCreate, SubscriptionPlanUpdate, 
    SubscriptionPlanResponse, SubscriptionPlanInDB,
    SYSTEM_PLAN_IDS, DEFAULT_SUBSCRIPTION_PLANS
)

router = APIRouter(prefix="/subscription-plans", tags=["Subscription Plans"])


@router.get("/public", response_model=List[SubscriptionPlanResponse])
async def list_public_subscription_plans():
    """Get active subscription plans (public endpoint)"""
    plans_collection = await get_collection("subscription_plans")
    
    # Only show active plans publicly
    filter_query = {"is_active": True}
    
    cursor = plans_collection.find(filter_query).sort("display_order", 1)
    plans = []
    
    async for plan_doc in cursor:
        # Convert ObjectId to string for Pydantic compatibility
        plan_doc_copy = plan_doc.copy()
        if "_id" in plan_doc_copy:
            plan_doc_copy["_id"] = str(plan_doc_copy["_id"])
        
        plan_data = SubscriptionPlanInDB(**plan_doc_copy)
        
        # Create response without sensitive statistics
        plan_response = SubscriptionPlanResponse(
            **plan_data.model_dump(),
            clinics_count=None,  # Hide statistics in public endpoint
            monthly_revenue=None
        )
        
        plans.append(plan_response)
    
    return plans


@router.get("/", response_model=List[SubscriptionPlanResponse])
async def list_subscription_plans(
    include_inactive: bool = Query(False, description="Include inactive plans"),
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get all subscription plans"""
    plans_collection = await get_collection("subscription_plans")
    clinics_collection = await get_collection("clinics")
    
    # Build filter
    filter_query = {}
    if not include_inactive:
        filter_query["is_active"] = True
    
    cursor = plans_collection.find(filter_query).sort("display_order", 1)
    plans = []
    
    async for plan_doc in cursor:
        # Convert ObjectId to string for Pydantic compatibility
        plan_doc_copy = plan_doc.copy()
        if "_id" in plan_doc_copy:
            plan_doc_copy["_id"] = str(plan_doc_copy["_id"])
        
        plan_data = SubscriptionPlanInDB(**plan_doc_copy)
        
        # Calculate statistics
        clinics_count = await clinics_collection.count_documents({
            "subscription_plan": plan_data.plan_id
        })
        
        # Calculate monthly revenue
        monthly_revenue = 0.0
        if plan_data.price > 0:
            active_clinics = await clinics_collection.count_documents({
                "subscription_plan": plan_data.plan_id,
                "subscription_status": "active"
            })
            monthly_revenue = plan_data.price * active_clinics
        
        plan_response = SubscriptionPlanResponse(
            **plan_data.model_dump(),
            clinics_count=clinics_count,
            monthly_revenue=monthly_revenue
        )
        plans.append(plan_response)
    
    return plans


@router.get("/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_subscription_plan(
    plan_id: str,
    current_admin: AdminInDB = Depends(get_current_admin_hybrid)
):
    """Get a specific subscription plan"""
    plans_collection = await get_collection("subscription_plans")
    clinics_collection = await get_collection("clinics")
    
    plan = await plans_collection.find_one({"plan_id": plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    
    # Convert ObjectId to string for Pydantic compatibility
    plan_copy = plan.copy()
    if "_id" in plan_copy:
        plan_copy["_id"] = str(plan_copy["_id"])
    
    plan_data = SubscriptionPlanInDB(**plan_copy)
    
    # Calculate statistics
    clinics_count = await clinics_collection.count_documents({
        "subscription_plan": plan_data.plan_id
    })
    
    monthly_revenue = 0.0
    if plan_data.price > 0:
        active_clinics = await clinics_collection.count_documents({
            "subscription_plan": plan_data.plan_id,
            "subscription_status": "active"
        })
        monthly_revenue = plan_data.price * active_clinics
    
    return SubscriptionPlanResponse(
        **plan_data.model_dump(),
        clinics_count=clinics_count,
        monthly_revenue=monthly_revenue
    )


@router.post("/", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_plan(
    plan_data: SubscriptionPlanCreate,
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)  # Only super admins can create plans
):
    """Create a new subscription plan with automatic unique ID generation"""
    plans_collection = await get_collection("subscription_plans")
    
    # Prepare plan document
    plan_dict = plan_data.model_dump()
    
    # Generate unique plan_id if not provided or ensure uniqueness
    if not plan_dict.get("plan_id") or plan_dict["plan_id"] == "":
        # Auto-generate based on plan name
        plan_dict["plan_id"] = UUIDGenerator.generate_plan_id(plan_data.name)
    
    # Ensure plan_id is unique
    plan_dict["plan_id"] = await UUIDGenerator.ensure_unique_plan_id(plan_dict["plan_id"])
    
    plan_dict.update({
        "_id": ObjectId(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_admin.username,
        "is_custom": True  # Mark as custom plan
    })
    
    # Insert into database
    result = await plans_collection.insert_one(plan_dict)
    plan_dict["_id"] = str(result.inserted_id)  # Convert ObjectId to string
    
    plan_db = SubscriptionPlanInDB(**plan_dict)
    return SubscriptionPlanResponse(**plan_db.model_dump(), clinics_count=0, monthly_revenue=0.0)


@router.put("/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_subscription_plan(
    plan_id: str,
    plan_data: SubscriptionPlanUpdate,
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Update a subscription plan"""
    plans_collection = await get_collection("subscription_plans")
    
    # Try to find by plan_id first, then by MongoDB _id
    existing_plan = await plans_collection.find_one({"plan_id": plan_id})
    if not existing_plan:
        # Try finding by MongoDB ObjectId if plan_id doesn't work
        try:
            existing_plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        except:
            pass
    
    if not existing_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    
    # Get the actual plan_id for system plan checks
    actual_plan_id = existing_plan.get("plan_id")
    
    # System plans have restrictions
    if actual_plan_id in SYSTEM_PLAN_IDS:
        # System plans can only update certain fields
        allowed_updates = {
            "name", "description", "price", "is_active", 
            "display_order", "color", "highlight", "notes"
        }
        update_dict = {k: v for k, v in plan_data.model_dump(exclude_unset=True).items() 
                      if k in allowed_updates and v is not None}
    else:
        # Custom plans can update all fields
        update_dict = {k: v for k, v in plan_data.model_dump(exclude_unset=True).items() 
                      if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid updates provided"
        )
    
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update in database using the correct identifier
    if "plan_id" in existing_plan:
        await plans_collection.update_one(
            {"plan_id": existing_plan["plan_id"]},
            {"$set": update_dict}
        )
        updated_plan = await plans_collection.find_one({"plan_id": existing_plan["plan_id"]})
    else:
        await plans_collection.update_one(
            {"_id": existing_plan["_id"]},
            {"$set": update_dict}
        )
        updated_plan = await plans_collection.find_one({"_id": existing_plan["_id"]})
    
    # Convert ObjectId to string for Pydantic compatibility
    updated_plan_copy = updated_plan.copy()
    if "_id" in updated_plan_copy:
        updated_plan_copy["_id"] = str(updated_plan_copy["_id"])
    
    plan_db = SubscriptionPlanInDB(**updated_plan_copy)
    
    # Calculate statistics using the actual plan_id
    clinics_collection = await get_collection("clinics")
    clinics_count = await clinics_collection.count_documents({
        "subscription_plan": plan_db.plan_id
    })
    
    monthly_revenue = 0.0
    if plan_db.price > 0:
        active_clinics = await clinics_collection.count_documents({
            "subscription_plan": plan_db.plan_id,
            "subscription_status": "active"
        })
        monthly_revenue = plan_db.price * active_clinics
    
    return SubscriptionPlanResponse(
        **plan_db.model_dump(),
        clinics_count=clinics_count,
        monthly_revenue=monthly_revenue
    )


@router.delete("/{plan_id}")
async def delete_subscription_plan(
    plan_id: str,
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Delete a subscription plan (only custom plans)"""
    plans_collection = await get_collection("subscription_plans")
    clinics_collection = await get_collection("clinics")
    
    # Try to find by plan_id first, then by MongoDB _id
    existing_plan = await plans_collection.find_one({"plan_id": plan_id})
    if not existing_plan:
        # Try finding by MongoDB ObjectId if plan_id doesn't work
        try:
            existing_plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        except:
            pass
    
    if not existing_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    
    # Get the actual plan_id for system plan checks
    actual_plan_id = existing_plan.get("plan_id")
    
    # Cannot delete system plans
    if actual_plan_id in SYSTEM_PLAN_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system subscription plans"
        )
    
    # Check if any clinics are using this plan
    clinics_using_plan = await clinics_collection.count_documents({
        "subscription_plan": actual_plan_id
    })
    
    if clinics_using_plan > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete plan. {clinics_using_plan} clinics are currently using this plan"
        )
    
    # Delete plan using the correct identifier
    if "plan_id" in existing_plan:
        await plans_collection.delete_one({"plan_id": existing_plan["plan_id"]})
    else:
        await plans_collection.delete_one({"_id": existing_plan["_id"]})
    
    return {"message": "Subscription plan deleted successfully"}


@router.post("/initialize-default-plans")
async def initialize_default_plans(
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Initialize database with default subscription plans"""
    plans_collection = await get_collection("subscription_plans")
    
    created_plans = []
    updated_plans = []
    
    for plan_config in DEFAULT_SUBSCRIPTION_PLANS:
        existing_plan = await plans_collection.find_one({"plan_id": plan_config["plan_id"]})
        
        if existing_plan:
            # Update existing plan but preserve custom modifications
            update_data = {
                "name": plan_config["name"],
                "description": plan_config["description"],
                "updated_at": datetime.utcnow()
            }
            
            await plans_collection.update_one(
                {"plan_id": plan_config["plan_id"]},
                {"$set": update_data}
            )
            updated_plans.append(plan_config["plan_id"])
        else:
            # Create new plan
            plan_doc = plan_config.copy()
            plan_doc.update({
                "_id": ObjectId(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_admin.username
            })
            
            await plans_collection.insert_one(plan_doc)
            created_plans.append(plan_config["plan_id"])
    
    return {
        "message": "Default subscription plans initialized",
        "created": created_plans,
        "updated": updated_plans
    }


@router.post("/{plan_id}/toggle-status")
async def toggle_plan_status(
    plan_id: str,
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Toggle plan active/inactive status"""
    plans_collection = await get_collection("subscription_plans")
    
    plan = await plans_collection.find_one({"plan_id": plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found"
        )
    
    new_status = not plan.get("is_active", True)
    
    await plans_collection.update_one(
        {"plan_id": plan_id},
        {"$set": {
            "is_active": new_status,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": f"Plan {'activated' if new_status else 'deactivated'} successfully",
        "plan_id": plan_id,
        "is_active": new_status
    }


@router.post("/{plan_id}/duplicate")
async def duplicate_subscription_plan(
    plan_id: str,
    new_plan_id: str,
    new_name: str,
    current_admin: AdminInDB = Depends(get_super_admin_hybrid)
):
    """Duplicate an existing subscription plan"""
    plans_collection = await get_collection("subscription_plans")
    
    # Check if source plan exists
    source_plan = await plans_collection.find_one({"plan_id": plan_id})
    if not source_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source subscription plan not found"
        )
    
    # Check if new plan_id already exists
    existing_plan = await plans_collection.find_one({"plan_id": new_plan_id})
    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target plan ID already exists"
        )
    
    # Create duplicate plan
    new_plan = source_plan.copy()
    new_plan.update({
        "_id": ObjectId(),
        "plan_id": new_plan_id,
        "name": new_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_admin.username,
        "is_custom": True,
        "is_active": True,
        "display_order": 99  # Put duplicated plans at the end
    })
    
    # Remove fields that shouldn't be copied
    new_plan.pop("clinics_count", None)
    new_plan.pop("monthly_revenue", None)
    
    result = await plans_collection.insert_one(new_plan)
    new_plan["_id"] = str(result.inserted_id)  # Convert ObjectId to string
    
    plan_db = SubscriptionPlanInDB(**new_plan)
    return SubscriptionPlanResponse(**plan_db.model_dump(), clinics_count=0, monthly_revenue=0.0)