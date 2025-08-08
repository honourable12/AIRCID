# app/api/v1/endpoints/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_async_session
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, UserCreate, UserRead
from app.models.role import Role
from app.api.dependencies.auth import get_llm_service_token 
from app.api.dependencies.auth import get_researcher_or_admin_user, get_admin_user, get_current_user
from pydantic import BaseModel
from typing import Optional, List
import os # Import os to get environment variables

router = APIRouter()

# Pydantic model for the token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    llm_access_token: Optional[str] = None # New field for the LLM service token

@router.post("/token", response_model=Token, summary="Authenticate user and get access token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Authenticates a user and returns a JWT access token for the Core Backend,
    and a separate JWT for the LLM service.
    """
    user_query = await session.execute(
        select(User)
        .where(User.email == form_data.username)
        .options(selectinload(User.role)) # Eagerly load the user's role
    )
    user = user_query.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # 1. Generate the JWT token for the CORE BACKEND
    # This token is used for authentication against core backend's endpoints.
    # We use 'user_id' in the payload as expected by get_current_user in dependencies.
    core_access_token_expires_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    core_access_token_expires = timedelta(minutes=core_access_token_expires_minutes)
    
    core_access_token = create_access_token(
        data={"user_id": user.id}, # Payload for core backend token
        expires_delta=core_access_token_expires
    )
    
    # 2. Fetch the JWT token from the LLM SERVICE
    # This token is specific to the LLM microservice.
    llm_access_token = await get_llm_service_token(user)
    
    # Ensure the role is loaded for the UserRead model
    user_read = UserRead.model_validate(user)

    return {
        "access_token": core_access_token,
        "token_type": "bearer",
        "user": user_read,
        "llm_access_token": llm_access_token # Return the LLM service token
    }


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Create a new user")
async def create_user(
    user_create: UserCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Register a new user. This endpoint is public and does not require authentication.
    """
    # Check if a user with the same email already exists
    existing_user_query = await session.execute(select(User).where(User.email == user_create.email))
    if existing_user_query.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Hash the password
    hashed_password = get_password_hash(user_create.password)

    # Fetch the role object based on the provided role name
    role_query = await session.execute(select(Role).where(Role.name == user_create.role_name))
    role_obj = role_query.scalars().first()
    if not role_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{user_create.role_name}' not found")
    
    # Create the new user instance
    new_user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hashed_password,
        role_id=role_obj.id,
        is_active=user_create.is_active
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user, attribute_names=["role"]) # Refresh to load the role relationship
    
    user_read = UserRead.model_validate(new_user)
    return user_read
