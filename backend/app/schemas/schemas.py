from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class ResumeBase(BaseModel):
    title: str

class ResumeCreate(ResumeBase):
    pass

class Resume(ResumeBase):
    id: int
    user_id: int
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    company: str
    description: str
    location: Optional[str] = None

class Job(JobBase):
    id: int
    required_skills: List[str]
    experience_level: str

    class Config:
        from_attributes = True
