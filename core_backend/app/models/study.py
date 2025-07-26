# app/models/study.py
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Import UserRead for Pydantic schema relationships if StudyRead includes creator
from app.models.user import UserRead

# Define the StudyStatus Enum
class StudyStatus(enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# SQLAlchemy ORM Model
class Study(Base):
    __tablename__ = "studies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Add the status column using SQLEnum
    status = Column(SQLEnum(StudyStatus), default=StudyStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Establish relationships
    creator = relationship("User", back_populates="created_studies")
    forms = relationship("Form", back_populates="study", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="study", cascade="all, delete-orphan")


# Pydantic Schemas
class StudyBase(BaseModel):
    title: str
    description: Optional[str] = None
    creator_id: int
    # Add status field to Pydantic base model
    status: StudyStatus = StudyStatus.PENDING # Default value

class StudyCreate(StudyBase):
    pass

class StudyUpdate(StudyBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StudyStatus] = None # Allow updating status

class StudyRead(StudyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserRead] = None

    class Config:
        from_attributes = True
        # Allow Pydantic to handle Enum values correctly
        use_enum_values = False

StudyRead.model_rebuild()