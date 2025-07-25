# app/models/user.py
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from pydantic import BaseModel, EmailStr

from app.core.database import Base # Import our SQLAlchemy Base
# from app.models.role import Role # <--- REMOVE OR COMMENT OUT THIS LINE

# SQLAlchemy ORM Model
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[EmailStr] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("roles.id"), nullable=True) # References 'roles.id'

    # Define relationship to Role (many-to-one) using a string forward reference
    role: Mapped["Role"] = relationship(back_populates="users", lazy="joined")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"

# Pydantic Schemas for API
class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    role_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    role_id: Optional[int] = None