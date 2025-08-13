from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from .admin import PyObjectId


class SubscriptionFeatures(BaseModel):
    whatsapp_integration: bool = True
    patient_history: bool = True
    appointment_scheduling: bool = True
    medical_records: bool = True
    analytics_dashboard: bool = False
    custom_branding: bool = False
    api_access: bool = False
    priority_support: bool = False


class ClinicBranding(BaseModel):
    clinic_title: str = "ClinicaAdmin"
    clinic_subtitle: str = "Sistema de Gestión Médica"
    logo_url: Optional[str] = None
    primary_color: str = "#3B82F6"
    secondary_color: str = "#1E40AF"


class PatientFieldConfig(BaseModel):
    field_name: str = Field(..., min_length=1, max_length=100)
    field_label: str = Field(..., min_length=1, max_length=200)
    field_type: str = Field(..., pattern="^(text|number|date|select|email|phone|textarea|boolean)$")
    is_required: bool = Field(default=False)
    is_visible: bool = Field(default=True)
    validation_rules: Dict[str, Any] = Field(default={})
    options: Optional[List[str]] = Field(default=None)  # For select fields
    placeholder: Optional[str] = Field(default=None)
    help_text: Optional[str] = Field(default=None)
    order: int = Field(default=0, ge=0)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ClinicService(BaseModel):
    service_id: str = Field(default="", max_length=100)
    service_type: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    base_price: float = Field(..., ge=0)
    currency: str = Field(default="COP", max_length=3)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    is_active: bool = Field(default=True)
    requires_appointment: bool = Field(default=True)
    category: Optional[str] = Field(None, max_length=100)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class WorkingHours(BaseModel):
    day_of_week: str = Field(..., pattern="^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$")
    start_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM format
    end_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")    # HH:MM format
    is_available: bool = Field(default=True)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ClinicSchedule(BaseModel):
    timezone: str = Field(default="America/Bogota", max_length=50)
    working_hours: List[WorkingHours] = Field(default=[])
    break_start: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    break_end: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    holiday_dates: List[str] = Field(default=[])  # ISO format dates
    special_hours: Dict[str, Dict[str, str]] = Field(default={})  # Date -> {start, end}
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ClinicContactInfo(BaseModel):
    phone: str = Field(..., min_length=8, max_length=20)
    whatsapp: Optional[str] = Field(None, min_length=8, max_length=20)
    email: str = Field(..., min_length=5, max_length=200)
    address: str = Field(..., min_length=10, max_length=500)
    website: Optional[str] = Field(None, max_length=200)
    maps_url: Optional[str] = Field(None, max_length=500)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}



class ClinicBase(BaseModel):
    clinic_id: str = Field(default="", max_length=100)  # Optional - will be auto-generated if empty
    name_clinic: str = Field(..., min_length=1, max_length=200)
    suscriber: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    cell_phone: str = Field(..., min_length=8, max_length=20)
    address: str = Field(..., min_length=1, max_length=500)
    status_clinic: str = Field(default="active", pattern="^(active|inactive|suspended)$")
    
    # Domain configuration for professional emails
    domain_name: Optional[str] = Field(None, min_length=3, max_length=100)  # e.g., "clinicamedica"
    email_domain: Optional[str] = Field(None, max_length=200)  # Auto-generated: clinicamedica.com
    
    # Subscription management
    subscription_status: str = Field(default="trial", pattern="^(trial|active|expired|cancelled)$")
    subscription_plan: str = Field(default="basic", pattern="^(trial|basic|premium|enterprise)$")
    subscription_expires: Optional[date] = None
    subscription_features: SubscriptionFeatures = Field(default_factory=SubscriptionFeatures)
    max_professionals: int = Field(default=5, ge=1, le=100)
    max_patients: int = Field(default=100, ge=1, le=10000)
    
    # Branding and customization
    branding: ClinicBranding = Field(default_factory=ClinicBranding)
    
    # WhatsApp & N8N configuration
    whatsapp_session_name: Optional[str] = None
    n8n_folder_id: Optional[str] = None
    n8n_folder_name: Optional[str] = None  # e.g., "Clinica Demo - Operativa"
    
    # Patient content configuration
    patient_form_fields: List[str] = Field(default=[
        "first_name", "last_name", "dni", "address", "cell_phone", 
        "mutual", "email", "birth_date"
    ])
    custom_patient_fields: List[dict] = Field(default=[])
    
    # Professional management
    professionals_count: int = Field(default=0, ge=0)
    max_professionals_allowed: int = Field(default=5, ge=1, le=100)  # Based on subscription plan
    
    # Services and schedule
    services: List[ClinicService] = Field(default=[])
    schedule: Optional[ClinicSchedule] = Field(default=None)
    contact_info: Optional[ClinicContactInfo] = Field(default=None)
    specialties: List[str] = Field(default=["Medicina General"])
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
    
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to model"""
        if data is None:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)



class ClinicCreate(ClinicBase):
    password: str = Field(..., min_length=8)


class ClinicUpdate(BaseModel):
    clinic_id: Optional[str] = Field(None, max_length=100)
    name_clinic: Optional[str] = Field(None, min_length=1, max_length=200)
    suscriber: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    cell_phone: Optional[str] = Field(None, min_length=8, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    status_clinic: Optional[str] = Field(None, pattern="^(active|inactive|suspended)$")
    domain_name: Optional[str] = Field(None, min_length=3, max_length=100)
    subscription_status: Optional[str] = Field(None, pattern="^(trial|active|expired|cancelled)$")
    subscription_plan: Optional[str] = Field(None, pattern="^(trial|basic|premium|enterprise)$")
    subscription_expires: Optional[date] = None
    max_professionals: Optional[int] = Field(None, ge=1, le=100)
    max_patients: Optional[int] = Field(None, ge=1, le=10000)
    whatsapp_session_name: Optional[str] = None
    n8n_folder_id: Optional[str] = None
    n8n_folder_name: Optional[str] = None
    custom_patient_fields: Optional[List[dict]] = None
    services: Optional[List[ClinicService]] = None
    schedule: Optional[ClinicSchedule] = None
    contact_info: Optional[ClinicContactInfo] = None
    specialties: Optional[List[str]] = None
    password: Optional[str] = Field(None, min_length=8)


class ClinicInDB(ClinicBase):
    id: str = Field(alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to model"""
        if data is None:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        
        # Convert datetime to date for subscription_expires if needed
        if "subscription_expires" in data and isinstance(data["subscription_expires"], datetime):
            data["subscription_expires"] = data["subscription_expires"].date()
        
        return cls(**data)


class ClinicResponse(ClinicBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class ClinicStatsResponse(BaseModel):
    total_clinics: int
    active_clinics: int
    trial_clinics: int
    expired_clinics: int
    revenue_monthly: float
    
    
class SubscriptionUpdate(BaseModel):
    subscription_status: str = Field(..., pattern="^(trial|active|expired|cancelled)$")
    subscription_plan: str = Field(..., pattern="^(trial|basic|premium|enterprise)$")
    subscription_expires: Optional[date] = None
    max_professionals: Optional[int] = Field(None, ge=1, le=100)
    max_patients: Optional[int] = Field(None, ge=1, le=10000)