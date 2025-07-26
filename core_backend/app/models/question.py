# app/models/question.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, Text, Boolean , DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import enum

# Define QuestionType Enum
class QuestionType(str, enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    DATE = "date"
    TIME = "time"
    DATETIME = "datetime"
    BOOLEAN = "boolean"


# SQLAlchemy ORM Model
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    text = Column(Text, nullable=False) # The question itself
    question_type = Column(SQLEnum(QuestionType), nullable=False)
    options = Column(Text, nullable=True) # JSON string for single/multi-choice options
    is_required = Column(Boolean, default=False)
    order = Column(Integer, default=0) # Order of questions within a form
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    form = relationship("Form", back_populates="questions")


# Pydantic Schemas
class QuestionBase(BaseModel):
    form_id: int = Field(..., example=1, description="ID of the form this question belongs to.")
    text: str = Field(..., example="What is your age?")
    question_type: QuestionType = Field(..., example=QuestionType.NUMBER)
    options: Optional[str] = Field(None, example='["Option A", "Option B"]', description="JSON string of options for choice questions.")
    is_required: bool = False
    order: int = Field(0, description="Order of the question within the form.")

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(QuestionBase):
    form_id: Optional[int] = None # Not usually changed after creation, but allowed
    text: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[str] = None
    is_required: Optional[bool] = None
    order: Optional[int] = None

class QuestionRead(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True