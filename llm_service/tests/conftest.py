import pytest
from httpx import AsyncClient
from main import app
from app.db_utils import init_db, engine, Base, SessionLocal

@pytest.fixture(scope="session")
def anyio_backend():
    """Configures pytest-asyncio to work with AnyIO."""
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    """
    Asynchronous test client for FastAPI application.
    Uses 'httpx' for making requests against the test app.
    """
    # Override get_db dependency to use a test database
    # This requires more advanced setup to ensure a clean DB for each test run.
    # For simplicity, we'll initialize the real DB for now, but in a real project,
    # you'd mock or use a separate test DB.
    init_db() # Ensure DB tables are created for tests

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# More advanced DB fixture for testing (optional but good practice)
@pytest.fixture(scope="function")
def db_session():
    """
    Provides a clean database session for each test function.
    Rolls back transactions after each test to ensure isolation.
    """
    Base.metadata.create_all(bind=engine) # Ensure tables are created
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

# You might need to override the get_db dependency in main.py for testing
# Example (add this somewhere accessible in tests or in main's test setup):
# from app.db_utils import get_db
# def override_get_db():
#     try:
#         db = SessionLocal()
#         yield db
#     finally:
#         db.close()
# app.dependency_overrides[get_db] = override_get_db