# app/api/dependencies/auth.py
import os
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.config import settings # Ensure this import is correct and settings is configured
from app.core.database import get_async_session
from app.models.user import User # Assuming User model is here or imported
from app.models.role import Role # Assuming Role model is here or imported
from app.models.role import RoleName # Assuming RoleName enum is here or imported
from pydantic import BaseModel

# --- Core Authentication Dependencies ---

# Password hashing context for bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer for handling JWT tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password using bcrypt."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a JWT access token with a given payload and optional expiry time.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Use settings for ACCESS_TOKEN_EXPIRE_MINUTES for consistency
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) 
    to_encode.update({"exp": expire})
    # Use settings for SECRET_KEY and ALGORITHM for consistency
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_async_session)) -> User:
    """
    Dependency to get the current authenticated user by validating their JWT token.
    Eagerly loads the user's role to prevent additional database calls.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the core backend's JWT token
        # Use settings for SECRET_KEY and ALGORITHM for consistency
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # FIX: Explicitly get 'user_id' from the payload, as sent by login endpoint
        user_id: int = payload.get("user_id") 
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        print(f"JWT Decoding Error in get_current_user: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in get_current_user: {e}")
        raise credentials_exception
    
    # Fetch the user from the database, eagerly loading their role
    user_with_role_query = await session.execute(
        select(User).where(User.id == user_id).options(selectinload(User.role))
    )
    user_with_role = user_with_role_query.scalars().first()

    if user_with_role is None:
        raise credentials_exception # User not found in DB or token refers to non-existent user

    if not user_with_role.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return user_with_role

async def get_researcher_or_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user has either 'researcher' or 'administrator' role.
    """
    if not current_user.role or current_user.role.name not in [RoleName.researcher, RoleName.administrator]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires researcher or administrator role"
        )
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user has the 'administrator' role.
    """
    if not current_user.role or current_user.role.name != RoleName.administrator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires administrator role"
        )
    return current_user

# --- LLM Service Admin Dependency (for internal service-to-service calls) ---

# This API key is used for the core backend to authenticate itself to the LLM service
# Ensure this matches the expected internal API key in your LLM microservice
LLM_SERVICE_API_KEY = os.environ.get("LLM_SERVICE_API_KEY", "your-secret-llm-api-key") 

# This dependency is usually for LLM service to Core Backend communication, 
# or specific internal LLM endpoints. 
# It's included here for completeness based on previous context.
async def get_llm_admin_user(
    api_key: str = Security(APIKeyHeader(name="X-LLM-Api-Key", auto_error=True)),
    session: AsyncSession = Depends(get_async_session)
):
    if api_key != LLM_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid LLM API Key"
        )
    mock_llm_user = User(id=-1, email="llm_service@example.com", username="llm_service_admin", role=Role(name="administrator"))
    return mock_llm_user

# --- LLM Service Communication Schemas ---
class LLMServiceTokenRequest(BaseModel):
    user_id: str
    username: str
    roles: List[str]

# --- LLM Service Communication Function ---
async def get_llm_service_token(current_user: User = Depends(get_researcher_or_admin_user)) -> Optional[str]:
    """
    Fetches a JWT token from the LLM microservice's /token endpoint for the given user.
    This token is used by the core backend to authenticate its requests to the LLM service.
    """
    if not current_user.role:
        print(f"User {current_user.email} has no assigned role, cannot get LLM token.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {current_user.email} has no assigned role.")
    
    # FIX: Use current_user.username if available, otherwise fallback to current_user.email
    username_for_llm =  current_user.email

    llm_service_url = os.environ.get("LLM_SERVICE_URL", "http://localhost:8001/api/v1") # Ensure this is correct and matches your LLM service URL

    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "user_id": str(current_user.id),
                "username": username_for_llm, 
                "roles": [current_user.role.name]
            }
            # Add print to show the exact payload being sent for debugging
            print(f"Attempting to fetch LLM token from {llm_service_url}/token with payload: {payload}")

            response = await client.post(f"{llm_service_url}/token", json=payload, timeout=5.0)
            response.raise_for_status() # Raise HTTPStatusError for 4xx/5xx responses
            token_data = response.json()
            return token_data.get("access_token")

    except httpx.HTTPStatusError as e:
        # Re-raise with a more specific error from the LLM service, including its detail
        # Attempt to parse JSON detail from response
        error_detail = e.response.json().get("detail", e.response.text) if e.response.text else e.response.text
        print(f"LLM service returned HTTP error {e.response.status_code}: {error_detail}")
        raise HTTPException(
            status_code=e.response.status_code, # Use the actual status code from LLM service
            detail=f"Error from LLM service token endpoint: {error_detail}"
        )
    except httpx.RequestError as e:
        # Re-raise with a specific network connection error
        print(f"Failed to connect to LLM service token endpoint at {e.request.url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to LLM service at {llm_service_url}. Check service status and URL."
        )
    except Exception as e:
        # Catch any other unexpected errors
        print(f"An unexpected error occurred while fetching the LLM token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching the LLM token: {e}"
        )