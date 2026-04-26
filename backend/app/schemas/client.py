from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID


class ClientCreate(BaseModel):
    name: str
    segment: Optional[str] = None
    status: str = "LEAD"
    main_contact_name: Optional[str] = None
    main_contact_email: Optional[EmailStr] = None
    main_contact_phone: Optional[str] = None
    notes: Optional[str] = None
    owner_id: Optional[UUID] = None
    created_by: Optional[UUID] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    segment: Optional[str] = None
    status: Optional[str] = None
    main_contact_name: Optional[str] = None
    main_contact_email: Optional[EmailStr] = None
    main_contact_phone: Optional[str] = None
    notes: Optional[str] = None
    owner_id: Optional[UUID] = None


class ClientResponse(BaseModel):
    id: UUID
    name: str
    segment: Optional[str]
    status: str
    main_contact_name: Optional[str]
    main_contact_email: Optional[str]

    class Config:
        from_attributes = True
