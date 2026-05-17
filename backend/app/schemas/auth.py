from uuid import UUID

from pydantic import BaseModel, EmailStr


class CurrentUserResponse(BaseModel):
    id: UUID
    auth_user_id: UUID
    name: str
    email: EmailStr
    role: str
    status: str

    class Config:
        from_attributes = True
