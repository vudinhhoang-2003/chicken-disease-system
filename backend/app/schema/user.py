from typing import Optional
from pydantic import BaseModel

# Shared properties
class UserBase(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    phone: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: Optional[str] = None
    password: str
    phone: str # Phone is mandatory
# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None
    class Config:
        orm_mode = True

# Additional properties to return via API
class UserOut(UserInDBBase):
    pass
