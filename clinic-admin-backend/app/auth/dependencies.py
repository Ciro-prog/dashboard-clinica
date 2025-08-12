from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from ..core.database import get_collection
from ..models.admin import AdminInDB
from ..models.clinic import ClinicInDB
from ..models.professional import ProfessionalInDB
from .security import verify_token

security = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """Get current authenticated user (admin, clinic, or professional)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required"
        )
        
    token = credentials.credentials
    payload = verify_token(token)
    
    user_type = payload.get("type")
    if not user_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    return payload


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> AdminInDB:
    """Get current authenticated admin"""
    if current_user.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get admin from database
    admins_collection = await get_collection("admins")
    admin = await admins_collection.find_one({"username": current_user["sub"]})
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found"
        )
    
    return AdminInDB(**admin)


async def get_current_clinic(current_user: dict = Depends(get_current_user)) -> ClinicInDB:
    """Get current authenticated clinic"""
    if current_user.get("type") != "clinic":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinic access required"
        )
    
    # Get clinic from database
    clinics_collection = await get_collection("clinics")
    clinic = await clinics_collection.find_one({"clinic_id": current_user["sub"]})
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clinic not found"
        )
    
    return ClinicInDB(**clinic)


async def get_super_admin(current_admin: AdminInDB = Depends(get_current_admin)) -> AdminInDB:
    """Require super admin role"""
    if current_admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_admin


async def get_admin_or_moderator(current_admin: AdminInDB = Depends(get_current_admin)) -> AdminInDB:
    """Require admin or moderator role"""
    if current_admin.role not in ["super_admin", "admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or moderator access required"
        )
    return current_admin


async def get_current_professional(current_user: dict = Depends(get_current_user)) -> ProfessionalInDB:
    """Get current authenticated professional"""
    if current_user.get("type") != "professional":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professional access required"
        )
    
    # Get professional from database
    professionals_collection = await get_collection("professionals")
    professional = await professionals_collection.find_one({"email": current_user["sub"]})
    
    if not professional:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Professional not found"
        )
    
    return ProfessionalInDB(**professional)


async def get_admin_or_clinic(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin or clinic access"""
    if current_user.get("type") not in ["admin", "clinic"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or clinic access required"
        )
    return current_user


async def get_professional_from_clinic(
    clinic_id: str,
    current_professional: ProfessionalInDB = Depends(get_current_professional)
) -> ProfessionalInDB:
    """Ensure professional belongs to specified clinic"""
    if current_professional.clinic_id != clinic_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Professional does not belong to this clinic"
        )
    return current_professional


async def verify_api_key(api_key: Optional[str] = Depends(api_key_header)) -> bool:
    """Verify X-API-Key header for Swagger UI and external access"""
    # List of valid API keys - in production, this should be from database or environment
    valid_api_keys = [
        "test123456",  # Test key for development
        "pampaserver2025enservermuA!",  # Production key
    ]
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header required"
        )
    
    if api_key not in valid_api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return True


async def get_user_or_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    api_key: Optional[str] = Depends(api_key_header)
) -> dict:
    """Allow authentication via Bearer token OR X-API-Key"""
    
    # Try API key first
    if api_key:
        valid_api_keys = [
            "test123456",  # Test key for development
            "pampaserver2025enservermuA!",  # Production key
        ]
        
        if api_key in valid_api_keys:
            return {
                "type": "api_key",
                "sub": "api_user",
                "authenticated_via": "x-api-key"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    
    # Fall back to Bearer token
    if credentials:
        token = credentials.credentials
        payload = verify_token(token)
        return payload
    
    # No authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required: provide Bearer token or X-API-Key header"
    )


# Hybrid authentication functions (Bearer OR API Key)
async def get_current_admin_hybrid(user: dict = Depends(get_user_or_api_key)) -> AdminInDB:
    """Get current authenticated admin (Bearer token OR X-API-Key)"""
    
    # If authenticated via API key, create admin-like user object
    if user.get("type") == "api_key":
        from datetime import datetime
        from bson import ObjectId
        
        # For API key authentication, create a virtual admin user
        return AdminInDB(
            id=ObjectId(),  # Generate valid ObjectId
            username="api_user", 
            email="api@admin.com",
            role="admin",  # API key has admin privileges
            is_active=True,
            password_hash="api_key_auth",  # Dummy password hash
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    
    # If authenticated via Bearer token, use normal admin logic
    if user.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get admin from database
    admins_collection = await get_collection("admins")
    admin = await admins_collection.find_one({"username": user["sub"]})
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found"
        )
    
    return AdminInDB(**admin)


async def get_admin_or_moderator_hybrid(current_admin: AdminInDB = Depends(get_current_admin_hybrid)) -> AdminInDB:
    """Require admin or moderator role (Bearer token OR X-API-Key)"""
    
    # API key always has admin privileges
    if current_admin.username == "api_user":
        return current_admin
        
    if current_admin.role not in ["super_admin", "admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or moderator access required"
        )
    return current_admin


async def get_super_admin_hybrid(current_admin: AdminInDB = Depends(get_current_admin_hybrid)) -> AdminInDB:
    """Require super admin role (Bearer token OR X-API-Key)"""
    
    # API key always has super admin privileges for external access
    if current_admin.username == "api_user":
        return current_admin
        
    if current_admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_admin