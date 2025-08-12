from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class DocumentCreate(BaseModel):
    patient_id: str
    file_name: str
    file_type: str
    file_size: int
    file_path: str
    document_type: str = Field(..., pattern="^(medical_record|lab_result|image|prescription|other)$")
    description: Optional[str] = None
    uploaded_by: str  # Professional ID who uploaded


class DocumentResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    file_name: str
    file_type: str
    file_size: int
    file_path: str
    document_type: str
    description: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}



class DocumentInDB(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    patient_id: str
    file_name: str
    file_type: str
    file_size: int
    file_path: str
    document_type: str
    description: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}



class PatientShare(BaseModel):
    patient_id: str
    shared_by: str  # Professional ID who shared
    shared_with: str  # Professional ID who receives access
    permissions: str = Field(..., pattern="^(read|write)$")
    shared_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None


class PatientShareResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    patient_name: str
    shared_by: str
    shared_by_name: str
    shared_with: str
    shared_with_name: str
    permissions: str
    shared_at: datetime
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
