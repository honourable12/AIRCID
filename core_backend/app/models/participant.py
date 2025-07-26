# app/models/participant.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Import the Pydantic UserRead model
from app.models.user import UserRead

# SQLAlchemy ORM Model
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional if participants can be anonymous
    # Add study_id if participants are linked to studies
    # study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Establish relationships
    user = relationship("User", back_populates="participants") # Assuming User model has a 'participants' relationship
    responses = relationship("Response", back_populates="participant", cascade="all, delete-orphan")
    # study = relationship("Study", back_populates="participants") # If linking to studies

# Pydantic Schemas
class ParticipantBase(BaseModel):
    user_id: Optional[int] = None # Make it optional for anonymous participants

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(ParticipantBase):
    pass

class ParticipantRead(ParticipantBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Ensure 'user' field is typed with the Pydantic UserRead model
    user: Optional[UserRead] = None # This must be UserRead, not User (ORM)

    class Config:
        from_attributes = True

# Rebuild the model to resolve any forward references (e.g., if UserRead was defined later)
ParticipantRead.model_rebuild()