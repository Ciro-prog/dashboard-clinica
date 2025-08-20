from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from ..core.database import get_collection
from ..core.uuid_generator import UUIDGenerator
from ..auth.dependencies import get_current_admin, get_admin_or_moderator, get_current_admin_hybrid, get_admin_or_moderator_hybrid
from ..auth.security import get_password_hash
from ..models.admin import AdminInDB
from ..models.clinic import (
    ClinicCreate, ClinicUpdate, ClinicResponse, ClinicInDB, 
    ClinicStatsResponse, SubscriptionUpdate, ClinicService,
    ClinicSchedule, ClinicContactInfo, WorkingHours
)
from ..models.professional import ProfessionalResponse
from pydantic import BaseModel
from typing import List, Dict, Any

# Response models for services endpoints
class ClinicServicesResponse(BaseModel):
    clinic_id: str
    clinic_name: str
    contact_info: Dict[str, Any]
    schedule: Dict[str, Any]
    services: List[Dict[str, Any]]
    professionals: List[Dict[str, Any]]
    specialties: List[str]
    last_updated: str
    status: str
    message: str
    
    model_config = {"populate_by_name": True}

class ServicesUpdateResponse(BaseModel):
    message: str
    services_count: int
    
    model_config = {"populate_by_name": True}

class InitializeServicesResponse(BaseModel):
    message: str
    services_count: int
    specialties_count: int
    
    model_config = {"populate_by_name": True}

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
    clinic_data["_id"] = str(result.inserted_id)  # Convert ObjectId to string
    
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
async def delete_clinic(clinic_id: str, current_admin: AdminInDB = Depends(get_current_admin_hybrid)):
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


# Default services based on N8N hardcoded data
DEFAULT_SERVICES = [
    {
        "service_id": "srv_general",
        "service_type": "Consulta General",
        "description": "Consulta médica general con evaluación completa",
        "base_price": 50000.0,
        "currency": "COP",
        "duration_minutes": 30,
        "category": "Medicina General",
        "requires_appointment": True,
        "is_active": True
    },
    {
        "service_id": "srv_specialist",
        "service_type": "Consulta Especializada",
        "description": "Consulta con especialista médico",
        "base_price": 75000.0,
        "currency": "COP",
        "duration_minutes": 45,
        "category": "Especialidades",
        "requires_appointment": True,
        "is_active": True
    },
    {
        "service_id": "srv_minor_surgery",
        "service_type": "Cirugía Menor",
        "description": "Procedimientos quirúrgicos menores ambulatorios",
        "base_price": 150000.0,
        "currency": "COP",
        "duration_minutes": 60,
        "category": "Cirugía",
        "requires_appointment": True,
        "is_active": True
    },
    {
        "service_id": "srv_major_surgery",
        "service_type": "Cirugía Mayor",
        "description": "Procedimientos quirúrgicos mayores",
        "base_price": 300000.0,
        "currency": "COP",
        "duration_minutes": 120,
        "category": "Cirugía",
        "requires_appointment": True,
        "is_active": True
    },
    {
        "service_id": "srv_emergency",
        "service_type": "Urgencia",
        "description": "Atención médica de urgencias",
        "base_price": 80000.0,
        "currency": "COP",
        "duration_minutes": 45,
        "category": "Urgencias",
        "requires_appointment": False,
        "is_active": True
    },
    {
        "service_id": "srv_home_visit",
        "service_type": "Consulta a Domicilio",
        "description": "Consulta médica en el domicilio del paciente",
        "base_price": 120000.0,
        "currency": "COP",
        "duration_minutes": 60,
        "category": "Domicilio",
        "requires_appointment": True,
        "is_active": True
    }
]

# Default schedule based on N8N hardcoded data
DEFAULT_SCHEDULE = {
    "timezone": "America/Bogota",
    "working_hours": [
        {"day_of_week": "monday", "start_time": "08:00", "end_time": "19:00", "is_available": True},
        {"day_of_week": "tuesday", "start_time": "08:00", "end_time": "19:00", "is_available": True},
        {"day_of_week": "wednesday", "start_time": "08:00", "end_time": "19:00", "is_available": True},
        {"day_of_week": "thursday", "start_time": "08:00", "end_time": "19:00", "is_available": True},
        {"day_of_week": "friday", "start_time": "08:00", "end_time": "19:00", "is_available": True},
        {"day_of_week": "saturday", "start_time": "08:00", "end_time": "13:00", "is_available": True},
        {"day_of_week": "sunday", "start_time": "00:00", "end_time": "00:00", "is_available": False}
    ],
    "break_start": "12:00",
    "break_end": "13:00",
    "holiday_dates": [],
    "special_hours": {}
}

DEFAULT_SPECIALTIES = [
    "Medicina General",
    "Cardiología", 
    "Dermatología",
    "Ginecología",
    "Pediatría",
    "Ortopedia",
    "Oftalmología"
]


@router.get("/{clinic_id}/services", response_model=ClinicServicesResponse, tags=["Clinic Services"])
async def get_clinic_services(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Get comprehensive clinic information including services, professionals, schedule and contact info.
    
    This endpoint provides all clinic data needed for N8N integration and workflows.
    Returns complete information about:
    - Clinic services with pricing and duration
    - Professional staff and their specializations  
    - Working hours and schedule
    - Contact information
    - Available specialties
    
    **Compatible with N8N workflows** - Single endpoint for all clinic data.
    """
    clinics_collection = await get_collection("clinics")
    professionals_collection = await get_collection("professionals")
    
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
    
    # Get professionals for this clinic
    professionals_cursor = professionals_collection.find({"clinic_id": str(clinic["_id"])})
    professionals_list = []
    async for prof in professionals_cursor:
        prof_data = {
            "id": str(prof["_id"]),
            "first_name": prof.get("first_name", ""),
            "last_name": prof.get("last_name", ""),
            "speciality": prof.get("speciality", ""),
            "email": prof.get("email", ""),
            "phone": prof.get("phone", ""),
            "status_professional": prof.get("status_professional", "active"),
            "bio": prof.get("bio", ""),
            "working_hours": prof.get("working_hours", ""),
            "consultation_fee": prof.get("consultation_fee", 0),
            "services": prof.get("services", [])  # Professional specific services
        }
        professionals_list.append(prof_data)
    
    # Get services or use defaults
    services = clinic.get("services", DEFAULT_SERVICES)
    
    # Get schedule or use defaults
    schedule = clinic.get("schedule", DEFAULT_SCHEDULE)
    
    # Get specialties or use defaults
    specialties = clinic.get("specialties", DEFAULT_SPECIALTIES)
    
    # Create contact info from clinic data
    contact_info = clinic.get("contact_info", {
        "phone": clinic.get("cell_phone", ""),
        "whatsapp": clinic.get("cell_phone", ""),
        "email": clinic.get("email", ""),
        "address": clinic.get("address", ""),
        "website": None,
        "maps_url": None
    })
    
    return {
        "clinic_id": str(clinic["_id"]),
        "clinic_name": clinic.get("name_clinic", ""),
        "contact_info": contact_info,
        "schedule": schedule,
        "services": services,
        "professionals": professionals_list,
        "specialties": specialties,
        "last_updated": datetime.utcnow().isoformat(),
        "status": "success",
        "message": "Clinic services retrieved successfully"
    }


@router.put("/{clinic_id}/services", response_model=ServicesUpdateResponse, tags=["Clinic Services"])
async def update_clinic_services(
    clinic_id: str,
    services: List[ClinicService],
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Update clinic services configuration.
    
    Replace all clinic services with the provided list. Each service includes:
    - service_type: Name of the medical service
    - description: Detailed description
    - base_price: Price in COP (Colombian Pesos)
    - currency: Currency code (default: COP)  
    - duration_minutes: Typical duration
    - category: Service category
    - requires_appointment: Whether appointment is needed
    - is_active: Service availability status
    """
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
    
    # Convert services to dict format
    services_data = []
    for service in services:
        service_dict = service.model_dump()
        if not service_dict.get("service_id"):
            service_dict["service_id"] = f"srv_{len(services_data) + 1}"
        services_data.append(service_dict)
    
    # Update clinic
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "services": services_data,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": "Clinic services updated successfully",
        "services_count": len(services_data)
    }


@router.put("/{clinic_id}/schedule", tags=["Clinic Services"])
async def update_clinic_schedule(
    clinic_id: str,
    schedule: ClinicSchedule,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Update clinic working schedule and hours.
    
    Configure the clinic's operational schedule including:
    - timezone: Clinic timezone (default: America/Bogota)
    - working_hours: Array of daily schedules with start/end times
    - break_start/break_end: Lunch break times
    - holiday_dates: List of holiday dates when clinic is closed
    - special_hours: Special operating hours for specific dates
    
    Each working_hours entry includes day_of_week, start_time, end_time, and availability.
    """
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
    
    # Update clinic
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "schedule": schedule.model_dump(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Clinic schedule updated successfully"}


@router.put("/{clinic_id}/contact-info", tags=["Clinic Services"])
async def update_clinic_contact_info(
    clinic_id: str,
    contact_info: ClinicContactInfo,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Update clinic contact information.
    
    Update detailed contact information for the clinic including:
    - phone: Main phone number
    - whatsapp: WhatsApp number (can be same as phone)
    - email: Contact email address
    - address: Physical address
    - website: Clinic website URL (optional)
    - maps_url: Google Maps location URL (optional)
    
    This information is used for patient communication and online presence.
    """
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
    
    # Update clinic
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "contact_info": contact_info.model_dump(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Clinic contact information updated successfully"}


@router.post("/{clinic_id}/services/initialize", response_model=InitializeServicesResponse, tags=["Clinic Services"])
async def initialize_clinic_services(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """
    Initialize clinic with default services and configuration.
    
    Sets up a new clinic with standard medical services based on N8N templates:
    - 6 default services (Consulta General, Especializada, Cirugías, etc.)
    - Standard schedule (Monday-Saturday, 8:00-19:00, Saturday until 13:00)
    - Contact information derived from clinic data
    - Common medical specialties
    
    **Use this for new clinics** to quickly set up with industry-standard configurations.
    This endpoint uses the same defaults that were previously hardcoded in N8N workflows.
    """
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
    
    # Create default contact info from clinic data
    default_contact_info = {
        "phone": clinic.get("cell_phone", ""),
        "whatsapp": clinic.get("cell_phone", ""),
        "email": clinic.get("email", ""),
        "address": clinic.get("address", ""),
        "website": None,
        "maps_url": None
    }
    
    # Update clinic with defaults
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {
            "services": DEFAULT_SERVICES,
            "schedule": DEFAULT_SCHEDULE,
            "contact_info": default_contact_info,
            "specialties": DEFAULT_SPECIALTIES,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": "Clinic initialized with default services successfully",
        "services_count": len(DEFAULT_SERVICES),
        "specialties_count": len(DEFAULT_SPECIALTIES)
    }


@router.post("/{clinic_id}/subscription/upgrade-preview")
async def get_upgrade_preview(
    clinic_id: str,
    upgrade_data: dict,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Calculate subscription upgrade preview with prorated pricing"""
    clinics_collection = await get_collection("clinics")
    plans_collection = await get_collection("subscription_plans")
    
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
    
    # Get current plan - try both plan_id and _id lookup
    current_plan_id = clinic.get("subscription_plan")
    current_plan = await plans_collection.find_one({"plan_id": current_plan_id})
    if not current_plan:
        # Try MongoDB _id lookup
        try:
            current_plan = await plans_collection.find_one({"_id": ObjectId(current_plan_id)})
        except:
            pass
    
    if not current_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El plan de suscripción '{current_plan_id}' no existe o no se ha cargado correctamente"
        )
    
    # Get new plan
    new_plan_id = upgrade_data.get("new_plan")
    new_plan = await plans_collection.find_one({"plan_id": new_plan_id})
    if not new_plan:
        # Try MongoDB _id lookup
        try:
            new_plan = await plans_collection.find_one({"_id": ObjectId(new_plan_id)})
        except:
            pass
    
    if not new_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El plan de destino '{new_plan_id}' no existe"
        )
    
    # Calculate preview
    immediate_upgrade = upgrade_data.get("immediate_upgrade", True)
    
    # Calculate days remaining
    days_remaining = 0
    if clinic.get("subscription_expires"):
        expiration_date = clinic["subscription_expires"]
        if isinstance(expiration_date, str):
            expiration_date = datetime.fromisoformat(expiration_date.replace('Z', '+00:00'))
        
        today = datetime.utcnow()
        diff_time = expiration_date - today
        days_remaining = max(0, diff_time.days)
    
    # Calculate pricing
    price_difference = new_plan["price"] - current_plan["price"]
    is_trial = current_plan["price"] == 0
    
    # For trials, always 0 regardless of timing
    # For paid users, prorated calculation only if immediate
    prorated_amount = 0.0 if is_trial else (price_difference * days_remaining / 30 if immediate_upgrade else 0.0)
    
    # Calculate next billing date
    if immediate_upgrade:
        next_billing_date = datetime.utcnow()
    else:
        today = datetime.utcnow()
        next_billing_date = datetime(today.year, today.month + 1, 1) if today.month < 12 else datetime(today.year + 1, 1, 1)
    
    savings_if_wait = 0.0 if immediate_upgrade else (0.0 if is_trial else price_difference)
    
    return {
        "current_plan": current_plan["name"],
        "new_plan": new_plan["name"],
        "price_difference": price_difference,
        "prorated_amount": prorated_amount,
        "days_remaining": days_remaining,
        "immediate_upgrade": immediate_upgrade,
        "next_billing_date": next_billing_date.isoformat(),
        "savings_if_wait": savings_if_wait
    }


@router.post("/{clinic_id}/subscription/upgrade")
async def upgrade_subscription(
    clinic_id: str,
    upgrade_data: dict,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Execute subscription upgrade"""
    clinics_collection = await get_collection("clinics")
    plans_collection = await get_collection("subscription_plans")
    
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
    
    # Validate new plan exists - try both plan_id and _id lookup
    new_plan_id = upgrade_data.get("new_plan")
    new_plan = await plans_collection.find_one({"plan_id": new_plan_id})
    if not new_plan:
        # Try MongoDB _id lookup
        try:
            new_plan = await plans_collection.find_one({"_id": ObjectId(new_plan_id)})
        except:
            pass
    
    if not new_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El plan de suscripción '{new_plan_id}' no existe"
        )
    
    # Calculate new subscription end date
    immediate_upgrade = upgrade_data.get("immediate_upgrade", True)
    billing_start_of_month = upgrade_data.get("billing_start_of_month", False)
    
    if immediate_upgrade:
        # Start from now
        new_subscription_start = datetime.utcnow()
    else:
        # Start from beginning of next month
        today = datetime.utcnow()
        new_subscription_start = datetime(today.year, today.month + 1, 1) if today.month < 12 else datetime(today.year + 1, 1, 1)
    
    new_subscription_end = datetime(
        new_subscription_start.year,
        new_subscription_start.month + (new_plan["duration_days"] // 30),
        new_subscription_start.day
    )
    
    # Update clinic subscription
    update_data = {
        "subscription_plan": new_plan["plan_id"],  # Use the actual plan_id from the database
        "subscription_status": "active",
        "subscription_expires": new_subscription_end,
        "max_professionals": new_plan["max_professionals"],
        "max_patients": new_plan["max_patients"],
        "updated_at": datetime.utcnow()
    }
    
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": update_data}
    )
    
    return {
        "message": "Subscription upgraded successfully",
        "new_plan": new_plan["name"],
        "new_plan_id": new_plan["plan_id"],
        "subscription_expires": new_subscription_end.isoformat(),
        "immediate_upgrade": immediate_upgrade
    }


@router.get("/{clinic_id}/payments")
async def get_payment_history(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Get payment history for clinic"""
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
    
    # Return empty payment history for now (can be extended later)
    return []


@router.patch("/{clinic_id}/subscription/fix-plan-reference")
async def fix_clinic_plan_reference(
    clinic_id: str,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Fix clinic plan reference mismatch by updating to correct plan ID"""
    clinics_collection = await get_collection("clinics")
    plans_collection = await get_collection("subscription_plans")
    
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
    
    current_plan_ref = clinic.get("subscription_plan", "")
    
    # Find the actual plan in the database with matching characteristics
    # Look for plans with "trial" in name or with $1 price
    plans_cursor = plans_collection.find({
        "$or": [
            {"name": {"$regex": "trial", "$options": "i"}},
            {"price": {"$in": [0, 1]}}
        ]
    })
    
    plans = await plans_cursor.to_list(length=None)
    
    if not plans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trial plans found in database"
        )
    
    # Find the best matching plan (prefer $1 price trial plan)
    target_plan = None
    for plan in plans:
        if plan.get("price") == 1 and "trial" in plan.get("name", "").lower():
            target_plan = plan
            break
    
    # Fallback to any trial plan
    if not target_plan:
        target_plan = plans[0]
    
    correct_plan_id = target_plan["plan_id"]
    
    # Update clinic plan reference if needed
    if current_plan_ref != correct_plan_id:
        update_result = await clinics_collection.update_one(
            {"_id": clinic["_id"]},
            {
                "$set": {
                    "subscription_plan": correct_plan_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count > 0:
            return {
                "message": f"Plan reference fixed: '{current_plan_ref}' → '{correct_plan_id}'",
                "old_plan_reference": current_plan_ref,
                "new_plan_reference": correct_plan_id,
                "plan_name": target_plan.get("name"),
                "plan_price": target_plan.get("price")
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update clinic plan reference"
            )
    else:
        return {
            "message": "Plan reference is already correct",
            "current_plan_reference": current_plan_ref,
            "plan_name": target_plan.get("name"),
            "plan_price": target_plan.get("price")
        }


@router.post("/{clinic_id}/payments")
async def record_payment(
    clinic_id: str,
    payment_data: dict,
    current_admin: AdminInDB = Depends(get_admin_or_moderator_hybrid)
):
    """Record a payment for clinic"""
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
    
    # If payment includes subscription update
    if payment_data.get("update_subscription"):
        selected_plan = payment_data.get("selected_plan")
        extension_days = payment_data.get("extension_days", 30)
        
        if selected_plan:
            plans_collection = await get_collection("subscription_plans")
            plan = await plans_collection.find_one({"plan_id": selected_plan})
            if not plan:
                # Try MongoDB _id lookup
                try:
                    plan = await plans_collection.find_one({"_id": ObjectId(selected_plan)})
                except:
                    pass
            
            if plan:
                # Calculate new expiration date
                current_expires = clinic.get("subscription_expires")
                if current_expires:
                    if isinstance(current_expires, str):
                        current_expires = datetime.fromisoformat(current_expires.replace('Z', '+00:00'))
                    new_expires = datetime(
                        current_expires.year,
                        current_expires.month,
                        current_expires.day
                    ) + timedelta(days=extension_days)
                else:
                    new_expires = datetime.utcnow() + timedelta(days=extension_days)
                
                # Update clinic subscription
                update_data = {
                    "subscription_plan": plan["plan_id"],
                    "subscription_status": "active",
                    "subscription_expires": new_expires,
                    "updated_at": datetime.utcnow()
                }
                
                await clinics_collection.update_one(
                    {"_id": clinic["_id"]},
                    {"$set": update_data}
                )
    
    return {
        "message": "Payment recorded successfully",
        "amount": payment_data.get("amount"),
        "payment_method": payment_data.get("payment_method"),
        "reference_number": payment_data.get("reference_number")
    }