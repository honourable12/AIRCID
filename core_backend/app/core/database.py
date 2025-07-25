# app/core/database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Database connection URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set.")

# Adjust URL for asyncpg driver if it's currently psycopg2
# SQLAlchemy uses 'postgresql+asyncpg' for the async driver
if DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DATABASE_URL.startswith("postgresql+psycopg://"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL # Assume it's already correct or needs no change

# Create the SQLAlchemy async engine
engine = create_async_engine(ASYNC_DATABASE_URL, echo=True) # echo=True for logging SQL statements

# Create a sessionmaker for AsyncSession
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Good practice for async sessions
)

# Base class for our declarative models
Base = declarative_base()

async def create_db_and_tables():
    """
    Creates all tables defined as SQLAlchemy declarative models.
    This is useful for initial setup or testing.
    In production, you'd typically use a migration tool like Alembic.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get an asynchronous database session for FastAPI endpoints.
    Ensures the session is closed after the request.
    """
    async with AsyncSessionLocal() as session:
        yield session
        await session.close()