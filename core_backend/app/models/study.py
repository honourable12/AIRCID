# app/models/study.py
from typing import Optional
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel

from app.core.database import Base # Import our SQLAlchemy Base

# SQLAlchemy ORM Model
class Study(Base):
    __tablename__ = "studies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    objective: Mapped[str] = mapped_column(Text) # Use Text for potentially longer strings
    status: Mapped[str] = mapped_column(String(50), default="Draft")
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Study(id={self.id}, title='{self.title}')>"

# Pydantic Schemas for API
class StudyBase(BaseModel):
    title: str
    objective: str
    status: str = "Draft"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class StudyCreate(StudyBase):
    pass

class StudyRead(StudyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudyUpdate(BaseModel):
    title: Optional[str] = None
    objective: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None