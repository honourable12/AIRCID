# app/main.py
from fastapi import Depends, FastAPI
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import create_db_and_tables, get_async_session
import app.models

from app.api.v1.endpoints import auth, users, studies, forms, questions, responses, participants

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating database tables...")
    await create_db_and_tables()
    print("Database tables created (or already exist).")
    yield

app = FastAPI(
    title="Central Backend Service",
    description="The platform's primary orchestration hub and central nervous system, built with Python FastAPI.",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(studies.router, prefix="/api/v1/studies", tags=["Studies"])
app.include_router(forms.router, prefix="/api/v1/forms", tags=["Forms"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(responses.router, prefix="/api/v1/responses", tags=["Responses"])
app.include_router(participants.router, prefix="/api/v1/participants", tags=["Participants"])


@app.get("/")
async def read_root(session: AsyncSession = Depends(get_async_session)):
    return {"message": "Welcome to the Central Backend Service API! Database session active."}