from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from .admin import PyObjectId


class ProfessionalBase(BaseModel):
    clinic_id: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    speciality: str = Field(..., min_length=1, max_length=200)
    email: EmailStr  # Auto-generated: first_name.last_name@clinic_domain.com
    phone: str = Field(..., min_length=8, max_length=20)
    status_professional: str = Field(default="active", pattern="^(active|inactive|vacation)$")
    license_number: Optional[str] = Field(None, max_length=100)
    
    # Authentication fields
    is_active: bool = Field(default=True)
    can_login: bool = Field(default=True)  # Can access professional portal
    permissions: List[str] = Field(default=["view_patients", "edit_patients", "view_history"])
    
    # Additional professional info
    bio: Optional[str] = Field(None, max_length=1000)
    working_hours: Optional[str] = Field(None, max_length=200)  # e.g., "Lun-Vie 9:00-17:00"
    consultation_fee: Optional[float] = Field(None, ge=0)  # Optional fee information
    
    # Professional services
    services: List[dict] = Field(default=[])  # List of services with custom pricing
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}



class ProfessionalCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    speciality: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=8, max_length=20)
    license_number: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    working_hours: Optional[str] = Field(None, max_length=200)
    consultation_fee: Optional[float] = Field(None, ge=0)
    
    # Password for professional login
    password: str = Field(..., min_length=8, max_length=100)
    
    # These will be auto-generated/assigned
    # clinic_id: set from URL parameter
    # email: auto-generated from first_name.last_name@clinic_domain


class ProfessionalUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    speciality: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=8, max_length=20)
    status_professional: Optional[str] = Field(None, pattern="^(active|inactive|vacation)$")
    license_number: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    working_hours: Optional[str] = Field(None, max_length=200)
    consultation_fee: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    can_login: Optional[bool] = None
    permissions: Optional[List[str]] = None


class ProfessionalInDB(ProfessionalBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str  # Hashed password for authentication
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
        return cls(**data)


class ProfessionalResponse(ProfessionalBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class ProfessionalCredentialsUpdate(BaseModel):
    password: str = Field(..., min_length=8, max_length=100)
    force_password_change: bool = Field(default=False)


class ProfessionalLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    clinic_id: Optional[str] = None  # Optional for additional validation