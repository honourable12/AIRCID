from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class StudyStatus(str, Enum):
    planning = "planning"
    active = "active"
    completed = "completed"
    archived = "archived"
    on_hold = "on_hold"

# SQLAlchemy ORM Model
class Study(Base):
    __tablename__ = "studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    objective = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=StudyStatus.planning.value, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="created_studies") # NEW relationship
    forms = relationship("Form", back_populates="study", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="study", cascade="all, delete-orphan")


# Pydantic Schemas (No changes needed for existing ones, but ensure they match ORM)
class StudyBase(BaseModel):
    title: str = Field(..., example="Alzheimer's Research", max_length=255)
    objective: str = Field(..., example="Investigate the early markers of Alzheimer's disease.", max_length=1000)
    description: Optional[str] = Field(None, example="A longitudinal study tracking cognitive decline.", max_length=5000)
    status: StudyStatus = Field(StudyStatus.planning, example=StudyStatus.active)
    start_date: Optional[datetime] = Field(None, example="2024-01-01T00:00:00Z")
    end_date: Optional[datetime] = Field(None, example="2025-12-31T23:59:59Z")
    is_public: bool = Field(False, example=True)

class StudyCreate(StudyBase):
    pass

class StudyUpdate(StudyBase):
    title: Optional[str] = None
    objective: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StudyStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: Optional[bool] = None

class StudyRead(StudyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator_id: int 
    creator_email: str

    class Config:
        from_attributes = True