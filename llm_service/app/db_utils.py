from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import hashlib

SQLALCHEMY_DATABASE_URL = "sqlite:///./documents.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_type = Column(String)
    content = Column(Text) 
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class AugmentedCriteriaVersion(Base):
    __tablename__ = "augmented_criteria_versions"
    id = Column(Integer, primary_key=True, index=True)
    original_input = Column(Text, nullable=False)
    original_input_hash = Column(String, index=True, nullable=False) 
    llm_output_json = Column(Text, nullable=False) 
    llm_model_used = Column(String, nullable=False) 
    version_timestamp = Column(DateTime, default=datetime.utcnow)
    version_number = Column(Integer, nullable=False)
    modified_by = Column(String, default="LLM", nullable=False)
    refinement_of_version_id = Column(Integer, ForeignKey('augmented_criteria_versions.id'), nullable=True)

class GeneratedFormVersion(Base):
    __tablename__ = "generated_form_versions"
    id = Column(Integer, primary_key=True, index=True)
    original_input = Column(Text, nullable=False) 
    original_input_hash = Column(String, index=True, nullable=False)
    llm_output_json_schema = Column(Text, nullable=False) 
    llm_model_used = Column(String, nullable=False)
    version_timestamp = Column(DateTime, default=datetime.utcnow)
    version_number = Column(Integer, nullable=False) 
    modified_by = Column(String, default="LLM", nullable=False) 
    refinement_of_version_id = Column(Integer, ForeignKey('generated_form_versions.id'), nullable=True)


def init_db():
    """Initializes the database by creating tables if they don't exist."""
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialization complete.")