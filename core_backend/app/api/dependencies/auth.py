# app/api/dependencies/auth.py
import os
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User
from app.models.role import Role
from app.models.role import RoleName
from pydantic import BaseModel

# --- Core Authentication Dependencies ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_async_session)) -> User:
    """
    Dependency to get the current authenticated user with their role eagerly loaded.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Perform a single, efficient query that eagerly loads the user's role
    user_with_role_query = await session.execute(
        select(User).where(User.email == username).options(selectinload(User.role))
    )
    user_with_role = user_with_role_query.scalars().first()

    if user_with_role is None:
        raise credentials_exception

    if not user_with_role.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return user_with_role

async def get_researcher_or_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if the current user is a researcher or an administrator."""
    # The current_user object is now guaranteed to have the role attribute loaded
    if not current_user.role or current_user.role.name not in [RoleName.researcher, RoleName.administrator]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires researcher or administrator role"
        )
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if the current user is an administrator."""
    # The current_user object is now guaranteed to have the role attribute loaded
    if not current_user.role or current_user.role.name != RoleName.administrator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires administrator role"
        )
    return current_user

# --- LLM Service Admin Dependency ---

LLM_SERVICE_API_KEY = os.environ.get("LLM_SERVICE_API_KEY", "your-secret-llm-api-key")
api_key_header = APIKeyHeader(name="X-LLM-Api-Key", auto_error=True)

async def get_llm_admin_user(
    api_key: str = Security(api_key_header),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Dependency for internal LLM service calls.
    Returns a mock admin user if the API key is valid.
    """
    if api_key != LLM_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid LLM API Key"
        )
    
    # This mock user is only used for service-to-service communication
    mock_llm_user = User(
        id=-1,
        email="llm_service@example.com",
        username="llm_service_admin",
        role=Role(name="administrator"),
    )
    return mock_llm_user

# --- LLM Service Communication Schemas ---
# Pydantic model for the data sent to the LLM service for a token
class LLMServiceTokenRequest(BaseModel):
    user_id: str  # Corrected to string
    username: str
    roles: List[str]

# --- LLM Service Communication Functions ---

async def get_llm_service_token(user: User) -> Optional[str]:
    """
    Calls the LLM service API to get a JWT token for a specific user.
    The role is dynamically retrieved from the user object, not hardcoded.
    """
    if not user.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {user.email} has no assigned role.")

    llm_service_url = os.environ.get("LLM_SERVICE_URL", "http://llm_service_host:port")
    
    # Create the data payload using the Pydantic model
    token_payload = LLMServiceTokenRequest(
        user_id=str(user.id),  # Corrected to cast to string
        username=user.email,
        roles=[user.role.name]  # Use the user's role name
    )
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{llm_service_url}/token",
                json=token_payload.model_dump(),
                headers={"X-LLM-Api-Key": LLM_SERVICE_API_KEY},
                timeout=5.0
            )
            response.raise_for_status()
            response_data = response.json()
            return response_data.get("access_token")
        except httpx.HTTPStatusError as e:
            # Re-raise with a more specific error from the LLM service
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Error from LLM service token endpoint: {e.response.text}"
            )
        except httpx.RequestError as e:
            # Re-raise with a specific network connection error
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not connect to LLM service at {llm_service_url}. Check service status and URL."
            )