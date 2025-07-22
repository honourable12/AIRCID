import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    """
    Asynchronous test client for the FastAPI application.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
