# app/models/question.py
import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum as SQLEnum
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import Base

# Import ORM models for relationships and ForeignKeys
from app.models.form import Form # Question needs Form for ForeignKey and relationship
# DO NOT import app.models.response.Response here.
# The relationship("Response") string reference is sufficient.

# Import Pydantic schemas for nesting in other Pydantic schemas, if needed.
# This import should be here IF QuestionRead needs to nest other Pydantic schemas,
# or if it's imported by another Pydantic schema in a way that needs early resolution.
# from app.models.response import ResponseRead # Only if QuestionRead nests ResponseRead

# Define the QuestionType Enum
class QuestionType(enum.Enum):
    TEXT = "text"
    NUMBER = "number"
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"

# SQLAlchemy ORM Model
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(SQLEnum(QuestionType), nullable=False)
    options = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Establish relationships
    form = relationship("Form", back_populates="questions")
    # This relationship uses a string literal, so direct import of Response is not needed here
    responses = relationship("Response", back_populates="question", cascade="all, delete-orphan")


# Pydantic Schemas
class QuestionBase(BaseModel):
    form_id: int
    text: str
    type: QuestionType
    options: Optional[str] = None
    order: int

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(QuestionBase):
    text: Optional[str] = None
    type: Optional[QuestionType] = None
    options: Optional[str] = None
    order: Optional[int] = None

class QuestionRead(QuestionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # If you want to include nested responses (as Pydantic schemas), uncomment this
    # responses: List["ResponseRead"] = [] # Use string literal for forward reference

    class Config:
        from_attributes = True
        use_enum_values = False

# IMPORTANT: If QuestionRead includes "ResponseRead", uncomment the import here AFTER QuestionRead class
# and then call model_rebuild().
# from app.models.response import ResponseRead # Uncomment if 'responses: List["ResponseRead"]' is used above

# Call model_rebuild() for QuestionRead if it has forward references (e.g., to ResponseRead)
# QuestionRead.model_rebuild()