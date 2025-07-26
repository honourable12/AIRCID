# app/models/response.py
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import Base

# Import ORM models for relationships at the top
# These are generally safe as ORM relationships can use string names
from app.models.form import Form
from app.models.question import Question
from app.models.participant import Participant # Assuming participant model exists and is an ORM model

# SQLAlchemy ORM Model for Responses
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    answer_text = Column(Text, nullable=True) # For text/number answers
    answer_options = Column(Text, nullable=True) # For single/multi-choice, store selected options as JSON string or delimited
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships (using string literals for ORM classes to avoid immediate circular deps)
    form = relationship("Form", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    participant = relationship("Participant", back_populates="responses")


# Pydantic Schemas for Responses
class ResponseBase(BaseModel):
    form_id: int
    question_id: int
    participant_id: int
    answer_text: Optional[str] = None
    answer_options: Optional[str] = None

class ResponseCreate(ResponseBase):
    pass

class ResponseUpdate(ResponseBase):
    answer_text: Optional[str] = None
    answer_options: Optional[str] = None

class ResponseRead(ResponseBase):
    id: int
    submitted_at: datetime
    updated_at: Optional[datetime] = None
    # If ResponseRead needs to nest other Pydantic schemas (like QuestionRead, FormRead, ParticipantRead)
    # use string literals for forward references in Pydantic schemas:
    # question: "QuestionRead" # Uncomment if you want to nest Question details
    # form: "FormRead" # Uncomment if you want to nest Form details
    # participant: "ParticipantRead" # Uncomment if you want to nest Participant details

    class Config:
        from_attributes = True
        use_enum_values = False

# IMPORTANT: If you uncommented any nested Pydantic schemas above (e.g., question: "QuestionRead"),
# then uncomment the corresponding imports for those Pydantic schemas here, *after*
# the ORM model definitions and after ResponseRead class definition.
# from app.models.question import QuestionRead # Uncomment this if 'question: "QuestionRead"' is used in ResponseRead
# from app.models.form import FormRead # Uncomment this if 'form: "FormRead"' is used in ResponseRead
# from app.models.participant import ParticipantRead # Uncomment this if 'participant: "ParticipantRead"' is used in ResponseRead

# Call model_rebuild() to resolve forward references for ResponseRead
# (Only if you uncommented any nested Pydantic schemas above)
# ResponseRead.model_rebuild()