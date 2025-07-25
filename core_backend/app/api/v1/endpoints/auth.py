# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_async_session
# Import the specific functions needed from security.py
from app.core.security import verify_password, create_access_token, get_password_hash # <-- ADD get_password_hash here
from app.models.user import User, UserCreate, UserRead
from app.models.role import Role

from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Pydantic model for the token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRegister(UserCreate):
    pass # Inherits email, password, is_active, role_id

@router.post("/token", response_model=Token, summary="Authenticate user and get access token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
    """
    Authenticates a user using email and password, returning an access token upon success.
    """
    user_query = await session.execute(select(User).where(User.email == form_data.username))
    user = user_query.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id, "role_id": user.role_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    user_data: UserRegister,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Registers a new user with the provided details. By default, new users are assigned the 'researcher' role
    unless a specific role_id is provided.
    """
    # Check if user already exists
    existing_user = await session.execute(select(User).where(User.email == user_data.email))
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password - CORRECTED LINE:
    hashed_password = get_password_hash(user_data.password) # <-- CORRECTED CALL

    # Determine role_id: default to 'researcher' if not specified
    if user_data.role_id is None:
        researcher_role_query = await session.execute(select(Role).where(Role.name == "researcher"))
        researcher_role = researcher_role_query.scalars().first()
        if not researcher_role:
            # Fallback or raise error if 'researcher' role isn't seeded
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Researcher role not found. Please seed the database."
            )
        user_data.role_id = researcher_role.id

    # Create new user instance
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=user_data.is_active,
        role_id=user_data.role_id
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user