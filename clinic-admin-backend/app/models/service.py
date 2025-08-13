from typing import Optional, List, Dict, Any
from datetime import datetime, time
from pydantic import BaseModel, Field
from enum import Enum


class ServiceType(str, Enum):
    CONSULTA_GENERAL = "Consulta General"
    CONSULTA_ESPECIALIZADA = "Consulta de Control"
    IMPLANTE_DENTAL = "Implante Dental"
    LIMPIEZA_DENTAL = "Limpieza Dental"
    ORTODONCIA = "Ortodoncia"
    ENDODONCIA = "Endodoncia"
    CIRUGIA_ORAL = "Cirugía Oral"
    ESTETICA_DENTAL = "Estética Dental"
    PROTESIS = "Prótesis"
    RADIOGRAFIA = "Radiografía"
    URGENCIA = "Urgencia"
    EVALUACION_INICIAL = "Evaluación Inicial"
    CIRUGIA_MENOR = "Cirugía Menor"
    CIRUGIA_MAYOR = "Cirugía Mayor"
    DOMICILIO = "Consulta a Domicilio"


class ClinicServiceBase(BaseModel):
    service_type: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    base_price: float = Field(..., ge=0)
    currency: str = Field(default="COP", max_length=3)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)  # 15 min to 8 hours
    is_active: bool = Field(default=True)
    requires_appointment: bool = Field(default=True)
    category: Optional[str] = Field(None, max_length=100)  # e.g., "Dental", "General", "Surgery"
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ProfessionalServiceBase(BaseModel):
    service_type: str = Field(..., min_length=1, max_length=200)
    professional_id: str = Field(..., min_length=1)
    price: float = Field(..., ge=0)
    currency: str = Field(default="COP", max_length=3)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(default=True)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class WorkingHours(BaseModel):
    day_of_week: str = Field(..., pattern="^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$")
    start_time: time
    end_time: time
    is_available: bool = Field(default=True)


class ClinicSchedule(BaseModel):
    timezone: str = Field(default="America/Bogota", max_length=50)
    working_hours: List[WorkingHours] = Field(default=[])
    break_start: Optional[time] = None
    break_end: Optional[time] = None
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


class ClinicServicesResponse(BaseModel):
    clinic_id: str
    clinic_name: str
    contact_info: ClinicContactInfo
    schedule: ClinicSchedule
    services: List[ClinicServiceBase]
    professionals: List[Dict[str, Any]]  # Professional info with their services
    specialties: List[str]
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class ServiceCreate(BaseModel):
    service_type: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    base_price: float = Field(..., ge=0)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    category: Optional[str] = Field(None, max_length=100)
    requires_appointment: bool = Field(default=True)


class ServiceUpdate(BaseModel):
    service_type: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    base_price: Optional[float] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    requires_appointment: Optional[bool] = None


class ScheduleUpdate(BaseModel):
    working_hours: Optional[List[WorkingHours]] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    timezone: Optional[str] = Field(None, max_length=50)


class ContactInfoUpdate(BaseModel):
    phone: Optional[str] = Field(None, min_length=8, max_length=20)
    whatsapp: Optional[str] = Field(None, min_length=8, max_length=20)
    website: Optional[str] = Field(None, max_length=200)
    maps_url: Optional[str] = Field(None, max_length=500)


# Default services based on N8N hardcoded data
DEFAULT_SERVICES = [
    {
        "service_type": "Consulta General",
        "description": "Consulta médica general con evaluación completa",
        "base_price": 50000.0,
        "currency": "COP",
        "duration_minutes": 30,
        "category": "Medicina General",
        "requires_appointment": True
    },
    {
        "service_type": "Consulta Especializada",
        "description": "Consulta con especialista médico",
        "base_price": 75000.0,
        "currency": "COP",
        "duration_minutes": 45,
        "category": "Especialidades",
        "requires_appointment": True
    },
    {
        "service_type": "Cirugía Menor",
        "description": "Procedimientos quirúrgicos menores ambulatorios",
        "base_price": 150000.0,
        "currency": "COP",
        "duration_minutes": 60,
        "category": "Cirugía",
        "requires_appointment": True
    },
    {
        "service_type": "Cirugía Mayor",
        "description": "Procedimientos quirúrgicos mayores",
        "base_price": 300000.0,
        "currency": "COP",
        "duration_minutes": 120,
        "category": "Cirugía",
        "requires_appointment": True
    },
    {
        "service_type": "Urgencia",
        "description": "Atención médica de urgencias",
        "base_price": 80000.0,
        "currency": "COP",
        "duration_minutes": 45,
        "category": "Urgencias",
        "requires_appointment": False
    },
    {
        "service_type": "Consulta a Domicilio",
        "description": "Consulta médica en el domicilio del paciente",
        "base_price": 120000.0,
        "currency": "COP",
        "duration_minutes": 60,
        "category": "Domicilio",
        "requires_appointment": True
    }
]

# Default working hours
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
    "break_end": "13:00"
}