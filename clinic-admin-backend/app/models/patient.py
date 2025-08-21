from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from .admin import PyObjectId


class MedicalFile(BaseModel):
    filename: str
    file_path: str  # Local path or MinIO object_name
    file_type: str  # image, document, pdf, etc.
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    
    # Enhanced metadata for MinIO integration
    storage_type: Optional[str] = Field(default="local", pattern="^(local|minio)$")
    document_id: Optional[str] = None  # Unique document identifier
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    uploaded_by: Optional[str] = None  # Professional who uploaded
    
    # MinIO-specific fields
    bucket_name: Optional[str] = None
    object_name: Optional[str] = None
    etag: Optional[str] = None


class VisitHistory(BaseModel):
    visit_date: datetime
    professional_id: str
    professional_name: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None
    files: List[MedicalFile] = []


class SharedRecord(BaseModel):
    professional_id: str
    professional_name: str
    shared_date: datetime
    shared_by: str
    notes: Optional[str] = None


class PatientBase(BaseModel):
    clinic_id: str = Field(..., min_length=1)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    dni: str = Field(..., min_length=1, max_length=20)  # Campo obligatorio
    address: str = Field(..., min_length=1, max_length=500)  # Campo obligatorio
    cell_phone: str = Field(..., min_length=8, max_length=20)  # Campo obligatorio
    mutual: Optional[str] = Field(None, max_length=200)  # Obra social/mutual (opcional)
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    status_patient: str = Field(default="active", pattern="^(active|inactive|archived)$")
    last_visit: Optional[datetime] = None
    visit_history: List[VisitHistory] = []
    medical_files: List[MedicalFile] = []
    medical_notes: Optional[str] = Field(None, max_length=2000)
    shared_with: List[SharedRecord] = []  # Track professionals with access
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}



class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    dni: Optional[str] = Field(None, min_length=1, max_length=20)
    address: Optional[str] = Field(None, min_length=1, max_length=500)
    cell_phone: Optional[str] = Field(None, min_length=8, max_length=20)
    mutual: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    birth_date: Optional[date] = None
    status_patient: Optional[str] = Field(None, pattern="^(active|inactive|archived)$")
    last_visit: Optional[datetime] = None
    medical_notes: Optional[str] = Field(None, max_length=2000)


class PatientInDB(PatientBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    @classmethod
    def from_mongo(cls, data):
        """Convert MongoDB document to model"""
        if data is None:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)


class PatientResponse(PatientBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime