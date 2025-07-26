# app/models/response.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Import Pydantic Read models for relationships
from app.models.question import QuestionRead
from app.models.participant import ParticipantRead

# SQLAlchemy ORM Model
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    response_text = Column(Text, nullable=True) # For open-ended answers
    response_value = Column(Integer, nullable=True) # For numerical/rating answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Establish relationships
    question = relationship("Question", back_populates="responses")
    participant = relationship("Participant", back_populates="responses")

# Pydantic Schemas
class ResponseBase(BaseModel):
    question_id: int
    participant_id: int
    response_text: Optional[str] = None
    response_value: Optional[int] = None

class ResponseCreate(ResponseBase):
    pass

class ResponseUpdate(ResponseBase):
    response_text: Optional[str] = None
    response_value: Optional[int] = None

class ResponseRead(ResponseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Ensure relationships are typed with their Pydantic Read models
    question: Optional[QuestionRead] = None # This must be QuestionRead, not Question (ORM)
    participant: Optional[ParticipantRead] = None # This must be ParticipantRead, not Participant (ORM)

    class Config:
        from_attributes = True

# Rebuild the model to resolve any forward references
ResponseRead.model_rebuild()