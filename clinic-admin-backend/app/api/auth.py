from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from ..core.database import get_collection
from ..auth.security import verify_password, create_admin_token, create_clinic_token, create_professional_token
from ..models.admin import AdminInDB
from ..models.clinic import ClinicInDB
from ..models.professional import ProfessionalInDB

router = APIRouter(prefix="/auth", tags=["Authentication"])


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_data: dict


class LoginRequest(BaseModel):
    username: str
    password: str
    user_type: str = "admin"  # "admin", "clinic", or "professional"


class ClinicLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Login for admins, clinics, and professionals"""
    
    if login_data.user_type == "admin":
        # Admin login
        admins_collection = await get_collection("admins")
        admin = await admins_collection.find_one({"username": login_data.username})
        
        if not admin or not verify_password(login_data.password, admin["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        if not admin.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin account is disabled"
            )
        
        # Update last login
        await admins_collection.update_one(
            {"_id": admin["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create token
        access_token = create_admin_token(admin)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_type="admin",
            user_data={
                "id": str(admin["_id"]),
                "username": admin["username"],
                "email": admin["email"],
                "role": admin["role"]
            }
        )
    
    elif login_data.user_type == "clinic":
        # Clinic login - compatible with existing frontend
        clinics_collection = await get_collection("clinics")
        clinic = await clinics_collection.find_one({
            "$or": [
                {"clinic_id": login_data.username},
                {"email": login_data.username}
            ]
        })
        
        if not clinic or not verify_password(login_data.password, clinic["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect credentials"
            )
        
        if clinic.get("status_clinic") != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clinic account is disabled"
            )
        
        # Update last login
        await clinics_collection.update_one(
            {"_id": clinic["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create token compatible with frontend
        access_token = create_clinic_token(clinic)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_type="clinic",
            user_data={
                "id": str(clinic["_id"]),
                "documentId": str(clinic["_id"]),
                "clinic_id": clinic["clinic_id"],
                "name_clinic": clinic["name_clinic"],
                "suscriber": clinic["suscriber"],
                "email": clinic["email"],
                "cell_phone": clinic["cell_phone"],
                "address": clinic["address"],
                "subcription": clinic.get("subscription_status") == "active",
                "status_clinic": clinic["status_clinic"],
                "subscription_status": clinic["subscription_status"],
                "subscription_plan": clinic["subscription_plan"],
                "whatsapp_number": clinic.get("whatsapp_session_name")
            }
        )
    
    elif login_data.user_type == "professional":
        # Professional login - by email
        professionals_collection = await get_collection("professionals")
        professional = await professionals_collection.find_one({
            "email": login_data.username
        })
        
        if not professional or not verify_password(login_data.password, professional["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect credentials"
            )
        
        if not professional.get("is_active", True) or not professional.get("can_login", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Professional account is disabled"
            )
        
        if professional.get("status_professional") != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Professional account is inactive"
            )
        
        # Update last login
        await professionals_collection.update_one(
            {"_id": professional["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create professional token
        access_token = create_professional_token(professional)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_type="professional",
            user_data={
                "id": str(professional["_id"]),
                "clinic_id": professional["clinic_id"],
                "first_name": professional["first_name"],
                "last_name": professional["last_name"],
                "email": professional["email"],
                "speciality": professional["speciality"],
                "permissions": professional.get("permissions", []),
                "status": professional["status_professional"]
            }
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user type"
        )


@router.post("/clinic-login", response_model=dict)
async def clinic_login(login_data: ClinicLoginRequest):
    """Simple clinic login endpoint for frontend compatibility"""
    clinics_collection = await get_collection("clinics")
    clinic = await clinics_collection.find_one({
        "$or": [
            {"clinic_id": login_data.email},
            {"email": login_data.email}
        ]
    })
    
    if not clinic or not verify_password(login_data.password, clinic["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if clinic.get("status_clinic") != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clinic account is disabled"
        )
    
    # Update last login
    await clinics_collection.update_one(
        {"_id": clinic["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    access_token = create_clinic_token(clinic)
    
    # Format response for frontend compatibility
    clinic_data = {
        "id": str(clinic["_id"]),
        "clinic_id": clinic["clinic_id"],
        "name_clinic": clinic["name_clinic"],
        "suscriber": clinic["suscriber"],
        "address": clinic["address"],
        "email": clinic["email"],
        "cell_phone": clinic["cell_phone"],
        "subscription_status": clinic["subscription_status"],
        "subscription_plan": clinic["subscription_plan"],
        "status_clinic": clinic["status_clinic"],
        "domain_name": clinic["domain_name"],
        "email_domain": clinic.get("email_domain"),
        "subscription_expires": clinic.get("subscription_expires"),
        "max_professionals": clinic["max_professionals"],
        "max_patients": clinic["max_patients"],
        "whatsapp_session_name": clinic.get("whatsapp_session_name"),
        "created_at": clinic["created_at"].isoformat() if clinic.get("created_at") else None,
        "updated_at": clinic["updated_at"].isoformat() if clinic.get("updated_at") else None,
        "last_login": clinic.get("last_login").isoformat() if clinic.get("last_login") else None
    }
    
    return {
        "clinic": clinic_data,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible login endpoint"""
    login_data = LoginRequest(
        username=form_data.username,
        password=form_data.password,
        user_type="admin"  # Default to admin for OAuth2
    )
    return await login(login_data)