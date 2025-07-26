# app/models/form.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# SQLAlchemy ORM Model
class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Foreign Key to Study
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    study = relationship("Study", back_populates="forms")

    # Relationship to Questions
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")

    # Optional: Link to the user who created it (requires user.id)
    # creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # creator = relationship("User", back_populates="created_forms")


# Pydantic Schemas
class FormBase(BaseModel):
    title: str = Field(..., example="Participant Consent Form")
    description: Optional[str] = Field(None, example="Consent form for new study participants.")
    is_active: bool = True
    study_id: int = Field(..., example=1, description="ID of the study this form belongs to.")

class FormCreate(FormBase):
    pass

class FormUpdate(FormBase):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    study_id: Optional[int] = None # Allow changing study_id or keep fixed? Usually fixed.

class FormRead(FormBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Add to your existing app/models/study.py to include the relationship to Forms
# (If app/models/study.py is not updated, this will cause a relationship error)