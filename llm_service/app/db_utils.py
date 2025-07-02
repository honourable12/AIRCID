import json
import os
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

DATABASE_URL = "sqlite:///./documents.db"

Base = declarative_base()

class Document(Base):
    #SQLAlchemy model for storing documents.
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(Text)
    metadata_json = Column(Text) # Store additional metadata as JSON string
    upload_timestamp = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Document(id={self.id}, filename='{self.filename}', uploaded='{self.upload_timestamp}')>"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    #Create the database tables if they don't exist.
    Base.metadata.create_all(bind=engine)
    print("SQLite database 'documents.db' initialized.")

def get_db():
    #Dependency for FastAPI to get a database session.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def store_document_in_db(filename: str, content: str, metadata: dict = None):
    """
    Stores a document's content and metadata in the SQLite database.
    Returns the newly created document object.
    """
    db = SessionLocal()
    try:
        metadata_json = json.dumps(metadata) if metadata else "{}"
        new_document = Document(
            filename=filename,
            content=content,
            metadata_json=metadata_json
        )
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        return new_document
    finally:
        db.close()

def get_document_content_from_db(doc_id: int):
    #Retrieves a document's content from the SQLite database by ID.
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == doc_id).first()
        return document.content if document else None
    finally:
        db.close()

def get_all_documents_for_indexing():
    #Retrieves all documents from the database for re-indexing into the vector store.
    db = SessionLocal()
    try:
        return db.query(Document).all()
    finally:
        db.close()