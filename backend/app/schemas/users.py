from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: str
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None
