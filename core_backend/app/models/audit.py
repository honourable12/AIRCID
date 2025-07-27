# app/models/audit.py
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base # Assuming Base is defined here
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any

class AuditLog(Base):
    """
    SQLAlchemy ORM model for storing audit trail entries.
    Records changes to data for compliance and traceability.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True) # ID of the user who performed the action (can be None for unauthenticated actions)
    action = Column(String(50), nullable=False) # e.g., 'CREATE', 'UPDATE', 'DELETE'
    table_name = Column(String(100), nullable=False) # Name of the table affected
    record_id = Column(Integer, nullable=True) # ID of the record being audited (can be None for new records before ID is assigned)
    old_values = Column(JSON, nullable=True) # JSON of old data for UPDATE/DELETE operations
    new_values = Column(JSON, nullable=True) # JSON of new data for CREATE/UPDATE operations
    timestamp = Column(DateTime(timezone=True), server_default=func.now()) # When the action occurred
    ip_address = Column(String(45), nullable=True) # Optional: IP address of the requester
    details = Column(Text, nullable=True) # Optional: Any additional descriptive details

    def __repr__(self):
        return (
            f"<AuditLog(id={self.id}, user_id={self.user_id}, action='{self.action}', "
            f"table_name='{self.table_name}', record_id={self.record_id}, "
            f"timestamp={self.timestamp})>"
        )

# Pydantic schema for reading audit logs (for API responses)
class AuditLogRead(BaseModel):
    """
    Pydantic schema for representing an AuditLog entry in API responses.
    """
    id: int
    user_id: Optional[int]
    action: str
    table_name: str
    record_id: Optional[int]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    timestamp: datetime
    ip_address: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True # Enable Pydantic to read from ORM attributes
        use_enum_values = False # Keep enum values as Enum members, not their string values

