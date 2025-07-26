from enum import Enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship, Mapped, mapped_column
from pydantic import BaseModel

from app.core.database import Base 
# from app.models.user import User

# SQLAlchemy ORM Model

class RoleName(str, Enum):
    administrator = "administrator"
    researcher = "researcher"
    participant = "participant"
    guest = "guest"
    
class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Define relationship to User (one-to-many) using a string forward reference
    users: Mapped[List["User"]] = relationship(back_populates="role")

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"

# Pydantic Schemas for API
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    id: int

    class Config:
        from_attributes = True

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None