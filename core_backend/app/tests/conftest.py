# tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app # Import your FastAPI app
from app.core.database import Base, get_async_session # Import your SQLAlchemy Base and session dependency
import asyncio

# Use an in-memory SQLite database for testing to ensure isolation
# This database will be created and destroyed for each test session.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """
    Provides the default event loop for pytest-asyncio.
    Ensures a consistent event loop across all async tests in a session.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def async_client():
    """
    Provides an asynchronous test client for your FastAPI application.
    This client can make requests to your API endpoints.
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(scope="session")
async def test_db_session():
    """
    Provides an asynchronous SQLAlchemy session configured for an in-memory SQLite database.
    This fixture:
    1. Creates all database tables before tests run.
    2. Overrides the `get_async_session` dependency in your FastAPI app to use the test database.
    3. Yields a session for tests to use directly for assertions (if needed).
    4. Drops all tables after tests complete to ensure a clean state.
    """
    # Create a new engine for the test database
    engine = create_async_engine(TEST_DATABASE_URL, echo=False) # Set echo=True to see SQL queries

    # Create tables in the test database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create a sessionmaker for the test database
    AsyncSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False, # Important for async sessions
    )
    
    # Define an override for the get_async_session dependency
    async def override_get_async_session():
        async with AsyncSessionLocal() as session:
            yield session

    # Apply the dependency override to the FastAPI app
    app.dependency_overrides[get_async_session] = override_get_async_session
    
    # Yield a session for individual tests to use for direct database interactions
    async with AsyncSessionLocal() as session:
        yield session

    # Clean up: Drop all tables after the test session finishes
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

