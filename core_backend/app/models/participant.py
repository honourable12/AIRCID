from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# SQLAlchemy ORM Model
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False) # Link to the study
    external_id = Column(String, unique=True, index=True, nullable=True) # Optional external identifier for anonymity/linking
    status = Column(String, default="enrolled") # e.g., "enrolled", "active", "completed", "withdrawn"
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True) # Any internal notes about the participant
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    study = relationship("Study", back_populates="participants")
    responses = relationship("Response", back_populates="participant", cascade="all, delete-orphan")


# Pydantic Schemas
class ParticipantBase(BaseModel):
    study_id: int = Field(..., example=1, description="The ID of the study this participant belongs to.")
    external_id: Optional[str] = Field(None, example="PID-001", description="An optional external ID for the participant.")
    status: str = Field("enrolled", example="enrolled", description="Current status of the participant (e.g., enrolled, active).")
    notes: Optional[str] = Field(None, example="Participant contacted via email on 2023-01-15.")

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(ParticipantBase):
    study_id: Optional[int] = None
    external_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ParticipantRead(ParticipantBase):
    id: int
    enrollment_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True