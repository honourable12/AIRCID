# app/models/form.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.core.database import Base
from app.models.study import Study
from app.models.user import UserRead
# NEW: Import the User ORM model to be used in the relationship
from app.models.user import User 

# Define a Pydantic schema for QuestionRead as a forward reference
class QuestionRead(BaseModel):
    id: int
    form_id: int
    text: str
    type: str
    model_config = ConfigDict(from_attributes=True)

# ORM Model for Forms
class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    study = relationship("Study", back_populates="forms")
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")
    created_by_user = relationship("User", back_populates="created_forms")


# Pydantic Schemas for Forms
class FormBase(BaseModel):
    study_id: int
    title: str
    description: Optional[str] = None

# We inherit from FormBase but don't add user_id, as it will be set by the endpoint
class FormCreate(FormBase):
    pass

class FormUpdate(FormBase):
    title: Optional[str] = None
    description: Optional[str] = None
    # user_id is now handled by the backend, no longer needed in update schema

class FormRead(FormBase):
    id: int
    user_id: int
    created_by_user: UserRead # Add the relationship here to return the user
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List[QuestionRead] = []

    model_config = ConfigDict(from_attributes=True)
