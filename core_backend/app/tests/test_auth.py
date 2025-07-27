# tests/test_auth.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User # Import the ORM User model for direct DB assertions
from app.models.role import Role # Import the ORM Role model for seeding test data

@pytest.mark.asyncio
async def test_register_user_success(async_client: AsyncClient, test_db_session: AsyncSession):
    """
    Test successful user registration.
    Ensures a new user can be registered and is saved to the database with a default role.
    """
    # Seed a 'researcher' role for the default assignment in auth.py
    researcher_role = Role(name="researcher")
    test_db_session.add(researcher_role)
    await test_db_session.commit()
    await test_db_session.refresh(researcher_role)

    user_data = {
        "email": "test_new@example.com",
        "password": "SecurePassword123"
    }
    response = await async_client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 201
    response_json = response.json()
    assert response_json["email"] == "test_new@example.com"
    assert response_json["is_active"] is True
    # Verify the default role_id was assigned (assuming researcher_role.id is used)
    assert response_json["role_id"] == researcher_role.id
    assert response_json["role"]["name"] == "researcher" # Check nested role data

    # Verify the user exists in the database
    db_user_result = await test_db_session.execute(select(User).where(User.email == "test_new@example.com"))
    db_user = db_user_result.scalars().first()
    assert db_user is not None
    assert db_user.email == "test_new@example.com"
    assert db_user.role_id == researcher_role.id

@pytest.mark.asyncio
async def test_register_existing_user_failure(async_client: AsyncClient, test_db_session: AsyncSession):
    """
    Test that registering a user with an already existing email fails.
    """
    # Seed a 'researcher' role for the default assignment
    researcher_role = Role(name="researcher")
    test_db_session.add(researcher_role)
    await test_db_session.commit()
    await test_db_session.refresh(researcher_role)

    # First, register a user successfully
    existing_user_data = {
        "email": "existing@example.com",
        "password": "Password123"
    }
    first_response = await async_client.post("/api/v1/auth/register", json=existing_user_data)
    assert first_response.status_code == 201

    # Now, try to register the same user again
    second_response = await async_client.post("/api/v1/auth/register", json=existing_user_data)
    
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Email already registered"

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, test_db_session: AsyncSession):
    """
    Test successful user login and token generation.
    """
    # Seed a 'researcher' role for the user
    researcher_role = Role(name="researcher")
    test_db_session.add(researcher_role)
    await test_db_session.commit()
    await test_db_session.refresh(researcher_role)

    # Register a user first (or use a seeded user)
    user_email = "login_test@example.com"
    user_password = "LoginPass123"
    await async_client.post("/api/v1/auth/register", json={"email": user_email, "password": user_password})

    # Now attempt to log in
    form_data = {
        "username": user_email,
        "password": user_password
    }
    response = await async_client.post("/api/v1/auth/token", data=form_data)
    
    assert response.status_code == 200
    response_json = response.json()
    assert "access_token" in response_json
    assert response_json["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient, test_db_session: AsyncSession):
    """
    Test login with incorrect password.
    """
    # Seed a 'researcher' role for the user
    researcher_role = Role(name="researcher")
    test_db_session.add(researcher_role)
    await test_db_session.commit()
    await test_db_session.refresh(researcher_role)

    # Register a user
    user_email = "invalid_login@example.com"
    user_password = "ValidPassword"
    await async_client.post("/api/v1/auth/register", json={"email": user_email, "password": user_password})

    # Attempt to log in with incorrect password
    form_data = {
        "username": user_email,
        "password": "WrongPassword"
    }
    response = await async_client.post("/api/v1/auth/token", data=form_data)
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

