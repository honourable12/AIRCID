from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import List
import os
from dotenv import load_dotenv

from app.db_utils import init_db, get_db, Document
from sqlalchemy.orm import Session
from app.api import documents, qna, criteria, forms, text
from app.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, User, role_required
from datetime import timedelta

load_dotenv()
os.environ.setdefault("JWT_SECRET_KEY", "your_default_secret_key") 

app = FastAPI(
    title="LLM Microservice",
    description="Microservice to assist clinical researchers with document processing, Q&A, and LLM-driven content generation and refinement.",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(qna.router, prefix="/qna", tags=["Q&A"])
app.include_router(criteria.router, prefix="/criteria", tags=["Criteria Augmentation"])
app.include_router(forms.router, prefix="/forms", tags=["Form Generation"])
app.include_router(text.router, prefix="/text", tags=["Automated Report & Note Summarization"])

@app.post("/token", summary="Generate a test JWT token for a user role")
async def login_for_access_token(
    user_id: str = "testuser",
    username: str = "Test User",
    roles: List[str] = ["researcher"]
):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "username": username, "roles": roles},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/")
async def root():
    return {"message": "LLM Microservice is running!"}