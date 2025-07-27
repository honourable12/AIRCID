# app/main.py
from fastapi import Depends, FastAPI, Request
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import create_db_and_tables, get_async_session
import app.models

from app.core.audit_middleware import set_audit_context, clear_audit_context, setup_audit_listeners
from app.api.v1.endpoints import auth, users, studies, forms, questions, responses, participants, export
from fastapi.middleware.cors import CORSMiddleware

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup SQLAlchemy event listeners during app startup
@app.on_event("startup")
async def startup_event():
    """
    Executes startup tasks, including setting up SQLAlchemy audit listeners.
    """
    setup_audit_listeners()
    print("Audit listeners set up.")

@app.middleware("http")
async def audit_context_middleware(request: Request, call_next):
    """
    Middleware to set and clear audit context (user ID, IP address) for each request.
    This ensures audit logs capture who performed an action.
    """
    user_id = None
    # Attempt to get user ID from request state, assuming an auth dependency
    # has already populated it (e.g., from a JWT token).
    # This assumes `get_current_user` or a similar dependency sets `request.state.user`.
    if hasattr(request.state, "user") and request.state.user:
        user_id = request.state.user.id
    
    client_ip = request.client.host if request.client else None
    
    # Set the context for SQLAlchemy event listeners
    set_audit_context(user_id, client_ip)

    try:
        response = await call_next(request)
    finally:
        # Always clear the context to prevent data leakage between requests
        clear_audit_context()
    
    return response





app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(studies.router, prefix="/api/v1/studies", tags=["Studies"])
app.include_router(forms.router, prefix="/api/v1/forms", tags=["Forms"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(responses.router, prefix="/api/v1/responses", tags=["Responses"])
app.include_router(participants.router, prefix="/api/v1/participants", tags=["Participants"])
app.include_router(export.router, prefix="/api/v1", tags=["Exports"])


@app.get("/")
async def read_root(session: AsyncSession = Depends(get_async_session)):
    return {"message": "Welcome to the Central Backend Service API! Database session active."}