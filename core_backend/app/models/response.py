from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field, Json
from typing import Optional, Any
from datetime import datetime
import json

# SQLAlchemy ORM Model
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=True) 
    answer_json = Column(Text, nullable=True)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    participant = relationship("Participant", back_populates="responses")
    form = relationship("Form", back_populates="responses_to_form")
    question = relationship("Question", back_populates="responses_to_question")


# Pydantic Schemas
class ResponseBase(BaseModel):
    participant_id: int = Field(..., example=1, description="The ID of the participant providing the response.")
    form_id: int = Field(..., example=1, description="The ID of the form this response belongs to.")
    question_id: int = Field(..., example=1, description="The ID of the question this response is for.")
    answer_text: Optional[str] = Field(None, example="25", description="The participant's answer as a string.")
    answer_data: Optional[Json[Any]] = Field(None, example='["Option A", "Option C"]', description="Complex answer data as JSON.")

class ResponseCreate(ResponseBase):
    pass

class ResponseUpdate(ResponseBase):
    answer_text: Optional[str] = None
    answer_data: Optional[Json[Any]] = None

class ResponseRead(ResponseBase):
    id: int
    submitted_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
