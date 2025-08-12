from typing import Optional, Annotated
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, PlainSerializer
from bson import ObjectId


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return ObjectId(v)
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str)
]


class AdminBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: str = Field(default="admin", pattern="^(super_admin|admin|moderator)$")
    is_active: bool = Field(default=True)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AdminCreate(AdminBase):
    password: str = Field(..., min_length=8)


class AdminUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(super_admin|admin|moderator)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


class AdminInDB(AdminBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class AdminResponse(AdminBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None