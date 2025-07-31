# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Ensure RoleRead is correctly imported for UserRead's 'role' field
from app.models.role import RoleRead

# SQLAlchemy ORM Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True) 
    role_id = Column(Integer, ForeignKey("roles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    created_studies = relationship("Study", back_populates="creator", cascade="all, delete-orphan")
    created_forms = relationship("Form", back_populates="created_by_user", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="user", cascade="all, delete-orphan")


# Pydantic Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

class UserRead(UserBase):
    id: int
    is_active: bool 
    role_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    role: Optional[RoleRead] = None 

    class Config:
        from_attributes = True

UserRead.model_rebuild()