# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload # <--- NEW IMPORT

from app.core.database import get_async_session
from app.core.security import verify_password, create_access_token, get_password_hash
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
    pass

@router.post("/token", response_model=Token, summary="Authenticate user and get access token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_async_session)
):
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

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Determine role_id: default to 'researcher' if not specified
    if user_data.role_id is None:
        researcher_role_query = await session.execute(select(Role).where(Role.name == "researcher"))
        researcher_role = researcher_role_query.scalars().first()
        if not researcher_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Researcher role not found. Please seed the database with 'researcher' role."
            )
        user_data.role_id = researcher_role.id

    # Create new user instance
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role_id=user_data.role_id
    )
    session.add(new_user)
    
    try:
        await session.commit()
        # After commit, the new_user object might be detached, especially relationships.
        # We need to re-query or explicitly load the relationship.

        # Option A (Recommended for this case): Refresh with selectinload
        # This will load the 'role' relationship immediately with the user.
        await session.refresh(new_user, attribute_names=["role"]) # <--- CRUCIAL CHANGE: Load 'role' explicitly
        
        # Ensure the role object is fully loaded for Pydantic serialization
        # The above refresh might be enough, but if not, an explicit select:
        # result = await session.execute(
        #     select(User)
        #     .options(selectinload(User.role)) # Eagerly load the role
        #     .where(User.id == new_user.id)
        # )
        # new_user = result.scalars().first()
        # if not new_user:
        #     raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User not found after creation.")

    except Exception as e:
        await session.rollback()
        # Catch foreign key violations more gracefully if needed, though the 'role_id=0' was the previous issue.
        # Now it's likely that 'researcher' role wasn't found if it fails here.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {e}"
        ) from e

    return new_user