from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from .admin import PyObjectId


class PlanFeatures(BaseModel):
    """Features configuration for a subscription plan"""
    whatsapp_integration: bool = True
    patient_history: bool = True
    appointment_scheduling: bool = False
    medical_records: bool = False
    analytics_dashboard: bool = False
    custom_branding: bool = False
    api_access: bool = False
    priority_support: bool = False
    # Allow additional custom features
    custom_features: Dict[str, Any] = Field(default_factory=dict)


class SubscriptionPlanBase(BaseModel):
    """Base subscription plan model"""
    plan_id: str = Field(default="", max_length=50)  # Optional - will be auto-generated if empty
    name: str = Field(..., min_length=3, max_length=100)  # e.g., "Plan Básico", "Plan Personalizado"
    description: str = Field(default="", max_length=500)
    price: float = Field(..., ge=0)  # Monthly price in currency
    currency: str = Field(default="USD", max_length=3)  # Currency code
    duration_days: int = Field(default=30, ge=1, le=365)  # Plan duration in days
    
    # Limits
    max_professionals: int = Field(..., ge=1, le=1000)
    max_patients: int = Field(..., ge=1, le=100000)
    storage_limit_gb: int = Field(default=10, ge=1, le=1000)  # Storage limit in GB
    
    # Features
    features: PlanFeatures = Field(default_factory=PlanFeatures)
    
    # Plan configuration
    is_active: bool = Field(default=True)
    is_custom: bool = Field(default=False)  # True for custom plans created by admins
    display_order: int = Field(default=0)  # Order for display in UI
    
    # Styling
    color: str = Field(default="#3B82F6")  # Color for UI display
    highlight: bool = Field(default=False)  # Highlight as "Popular" or "Recommended"
    
    # Metadata
    created_by: Optional[str] = None  # Admin username who created this plan
    notes: str = Field(default="", max_length=1000)  # Internal notes


class SubscriptionPlanCreate(SubscriptionPlanBase):
    """Model for creating subscription plans"""
    pass


class SubscriptionPlanUpdate(BaseModel):
    """Model for updating subscription plans"""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    max_professionals: Optional[int] = Field(None, ge=1, le=1000)
    max_patients: Optional[int] = Field(None, ge=1, le=100000)
    storage_limit_gb: Optional[int] = Field(None, ge=1, le=1000)
    features: Optional[PlanFeatures] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    color: Optional[str] = None
    highlight: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)


class SubscriptionPlanInDB(SubscriptionPlanBase):
    """Model for subscription plans in database"""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to model"""
        if data is None:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)


class SubscriptionPlanResponse(SubscriptionPlanBase):
    """Model for subscription plan API responses"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    # Statistics (computed at runtime)
    clinics_count: Optional[int] = None  # Number of clinics using this plan
    monthly_revenue: Optional[float] = None  # Revenue from this plan
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# Predefined system plans that cannot be deleted
SYSTEM_PLAN_IDS = ["trial", "basic", "premium", "enterprise"]

# Default plans for initial database seeding
DEFAULT_SUBSCRIPTION_PLANS = [
    {
        "plan_id": "trial",
        "name": "Prueba Gratuita",
        "description": "Plan gratuito para probar el sistema por 30 días",
        "price": 0.0,
        "currency": "USD",
        "duration_days": 30,
        "max_professionals": 2,
        "max_patients": 50,
        "storage_limit_gb": 5,
        "features": {
            "whatsapp_integration": True,
            "patient_history": True,
            "appointment_scheduling": False,
            "medical_records": False,
            "analytics_dashboard": False,
            "custom_branding": False,
            "api_access": False,
            "priority_support": False
        },
        "is_active": True,
        "is_custom": False,
        "display_order": 1,
        "color": "#6B7280",
        "highlight": False,
        "notes": "Plan de prueba gratuito para nuevos usuarios"
    },
    {
        "plan_id": "basic",
        "name": "Plan Básico",
        "description": "Plan ideal para clínicas pequeñas con funcionalidades esenciales",
        "price": 29.99,
        "currency": "USD",
        "duration_days": 30,
        "max_professionals": 5,
        "max_patients": 200,
        "storage_limit_gb": 25,
        "features": {
            "whatsapp_integration": True,
            "patient_history": True,
            "appointment_scheduling": True,
            "medical_records": True,
            "analytics_dashboard": False,
            "custom_branding": False,
            "api_access": False,
            "priority_support": False
        },
        "is_active": True,
        "is_custom": False,
        "display_order": 2,
        "color": "#3B82F6",
        "highlight": False,
        "notes": "Plan básico con características fundamentales"
    },
    {
        "plan_id": "premium",
        "name": "Plan Premium",
        "description": "Plan completo para clínicas en crecimiento con todas las funcionalidades",
        "price": 59.99,
        "currency": "USD",
        "duration_days": 30,
        "max_professionals": 15,
        "max_patients": 1000,
        "storage_limit_gb": 100,
        "features": {
            "whatsapp_integration": True,
            "patient_history": True,
            "appointment_scheduling": True,
            "medical_records": True,
            "analytics_dashboard": True,
            "custom_branding": True,
            "api_access": False,
            "priority_support": True
        },
        "is_active": True,
        "is_custom": False,
        "display_order": 3,
        "color": "#8B5CF6",
        "highlight": True,  # Mark as popular
        "notes": "Plan recomendado para la mayoría de clínicas"
    },
    {
        "plan_id": "enterprise",
        "name": "Plan Empresarial",
        "description": "Solución empresarial para grandes organizaciones médicas",
        "price": 99.99,
        "currency": "USD",
        "duration_days": 30,
        "max_professionals": 50,
        "max_patients": 5000,
        "storage_limit_gb": 500,
        "features": {
            "whatsapp_integration": True,
            "patient_history": True,
            "appointment_scheduling": True,
            "medical_records": True,
            "analytics_dashboard": True,
            "custom_branding": True,
            "api_access": True,
            "priority_support": True
        },
        "is_active": True,
        "is_custom": False,
        "display_order": 4,
        "color": "#10B981",
        "highlight": False,
        "notes": "Plan empresarial para grandes organizaciones"
    }
]