from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from ..core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_clinic_token(clinic_data: dict) -> str:
    """Create token for clinic authentication (compatible with frontend)"""
    token_data = {
        "sub": clinic_data["clinic_id"],
        "email": clinic_data["email"],
        "clinic_id": clinic_data["clinic_id"],
        "name_clinic": clinic_data["name_clinic"],
        "suscriber": clinic_data["suscriber"],
        "type": "clinic"
    }
    return create_access_token(token_data)


def create_admin_token(admin_data: dict) -> str:
    """Create token for admin authentication"""
    token_data = {
        "sub": admin_data["username"],
        "email": admin_data["email"],
        "role": admin_data["role"],
        "type": "admin"
    }
    return create_access_token(token_data)


def create_professional_token(professional_data: dict) -> str:
    """Create token for professional authentication"""
    token_data = {
        "sub": professional_data["email"],
        "email": professional_data["email"],
        "clinic_id": professional_data["clinic_id"],
        "professional_id": str(professional_data["_id"]),
        "first_name": professional_data["first_name"],
        "last_name": professional_data["last_name"],
        "speciality": professional_data["speciality"],
        "permissions": professional_data.get("permissions", []),
        "type": "professional"
    }
    return create_access_token(token_data)