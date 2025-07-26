# app/models/question.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum as PyEnum # Import Python's Enum

# Define QuestionType enum
class QuestionType(str, PyEnum):
    text = "text"
    textarea = "textarea"
    number = "number"
    radio = "radio"
    checkbox = "checkbox"
    dropdown = "dropdown"
    date = "date"
    time = "time"
    datetime = "datetime"
    file = "file" # For file uploads

# SQLAlchemy ORM Model
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"))
    text = Column(Text, nullable=False)
    type = Column(SQLEnum(QuestionType), nullable=False) # Store enum in DB
    options = Column(Text, nullable=True) # Store JSON string for radio/checkbox/dropdown options
    order = Column(Integer, nullable=False, default=0) # Order of questions in a form
    is_required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    form = relationship("Form", back_populates="questions")
    responses = relationship("ResponseDetail", back_populates="question", cascade="all, delete-orphan")


# Pydantic Schemas
class QuestionBase(BaseModel):
    form_id: Optional[int] = None # Can be set during creation or in the endpoint
    text: str = Field(..., example="What is your full name?")
    type: QuestionType = Field(..., example=QuestionType.text)
    options: Optional[str] = Field(None, example='["Option 1", "Option 2"] for radio/checkbox/dropdown')
    order: int = Field(0, example=0)
    is_required: bool = Field(False, example=False)

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    type: Optional[QuestionType] = None
    options: Optional[str] = None
    order: Optional[int] = None
    is_required: Optional[bool] = None

class QuestionRead(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# No model_rebuild needed here as it doesn't reference other Pydantic models with string literals directly