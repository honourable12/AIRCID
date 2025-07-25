# app/models/audit_log.py
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel

from app.core.database import Base # Import our SQLAlchemy Base

# SQLAlchemy ORM Model
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Use Text for potentially longer strings

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', entity_type='{self.entity_type}')>"

# Pydantic Schemas for API
class AuditLogBase(BaseModel):
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogRead(AuditLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True