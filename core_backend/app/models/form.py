# app/models/form.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Import related Pydantic schemas
from app.models.user import UserRead # For the creator of the form
# from app.models.study import StudyRead # Assuming forms belong to studies, this will be handled by context
from app.models.question import QuestionRead # For questions within the form


# SQLAlchemy ORM Model
class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    study_id = Column(Integer, ForeignKey("studies.id"))
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True) # Forms can be active/inactive

    study = relationship("Study", back_populates="forms")
    creator = relationship("User", back_populates="created_forms") # Assuming a relationship from User to Form
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")


# Pydantic Schemas
class FormBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, example="Participant Consent Form")
    description: Optional[str] = Field(None, example="This form collects consent from study participants.")
    study_id: int = Field(..., example=1)
    is_active: bool = Field(True, example=True)

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class FormRead(FormBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    creator: Optional[UserRead] = None # Use UserRead for the creator
    questions: List[QuestionRead] = [] # Use QuestionRead for questions

    class Config:
        from_attributes = True

# Rebuild the model to resolve forward references (e.g., if any nested models were string literals, or for Pydantic v2 compatibility)
FormRead.model_rebuild()