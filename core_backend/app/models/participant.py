# app/models/participant.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Import the Pydantic UserRead model and StudyRead model
from app.models.user import UserRead
from app.models.study import StudyRead # Import the StudyRead model

# SQLAlchemy ORM Model
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional if participants can be anonymous
    # FIX: Add study_id as a ForeignKey
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False, index=True) # Participant must belong to a study
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Establish relationships
    user = relationship("User", back_populates="participants")
    responses = relationship("Response", back_populates="participant", cascade="all, delete-orphan")
    # FIX: Establish the relationship to Study
    study = relationship("Study", back_populates="participants") # Link to the Study model


# Pydantic Schemas
class ParticipantBase(BaseModel):
    user_id: Optional[int] = None # Make it optional for anonymous participants
    study_id: int # Participant must be associated with a study

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(ParticipantBase):
    # Allow updating user_id and study_id, or make them immutable after creation if desired
    user_id: Optional[int] = None
    study_id: Optional[int] = None # Allow updating study, but consider implications

class ParticipantRead(ParticipantBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Ensure 'user' field is typed with the Pydantic UserRead model
    user: Optional[UserRead] = None
    # Include the Pydantic StudyRead model for the related study
    study: Optional[StudyRead] = None # This must be StudyRead, not Study (ORM)

    class Config:
        from_attributes = True

# Rebuild the model to resolve any forward references
ParticipantRead.model_rebuild()