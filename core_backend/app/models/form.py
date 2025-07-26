# app/models/form.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import Base
from app.models.study import Study
from app.models.user import User # NEW: Import the User ORM model

# ORM Model for Forms
class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    # NEW: Add user_id as a ForeignKey to users.id
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    study = relationship("Study", back_populates="forms")
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")
    # NEW: Relationship back to the User who created this form
    created_by_user = relationship("User", back_populates="created_forms")


# Pydantic Schemas for Forms
class FormBase(BaseModel):
    study_id: int
    user_id: int # NEW: Include user_id in the Pydantic schema
    title: str
    description: Optional[str] = None

class FormCreate(FormBase):
    pass

class FormUpdate(FormBase):
    title: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None # Optional for updates, if allowed

class FormRead(FormBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List["QuestionRead"] = [] # Use string literal for forward reference

    class Config:
        from_attributes = True
        use_enum_values = False

# IMPORTANT: Import Pydantic schemas that are part of circular references *after*
# the ORM models are defined in their respective files.
from app.models.question import QuestionRead # This import is placed here to avoid circular imports
FormRead.model_rebuild()