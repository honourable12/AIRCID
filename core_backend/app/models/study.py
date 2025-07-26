from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import enum

# Define StudyStatus Enum if not already present
class StudyStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    CANCELLED = "cancelled"


# SQLAlchemy ORM Model
class Study(Base):
    __tablename__ = "studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    objective = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(StudyStatus), default=StudyStatus.PLANNING, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add this line for the relationship to Forms
    forms = relationship("Form", back_populates="study", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="study", cascade="all, delete-orphan")

    # Optional: Relationship to the user who created it
    # creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # creator = relationship("User", back_populates="created_studies")


# Pydantic Schemas (Keep your existing schemas here)
class StudyBase(BaseModel):
    title: str = Field(..., example="Impact of Social Media on Mental Health")
    objective: str = Field(..., example="To assess the correlation between daily social media usage and self-reported anxiety levels in young adults.")
    description: Optional[str] = Field(None, example="A mixed-methods study combining surveys and qualitative interviews.")
    status: StudyStatus = StudyStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_public: bool = False

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

    class Config:
        from_attributes = True