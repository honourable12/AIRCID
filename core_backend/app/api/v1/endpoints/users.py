from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_async_session
from app.api.dependencies.auth import get_current_user, get_admin_user, get_researcher_or_admin_user
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.models.role import Role 

router = APIRouter()

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin only)")
async def create_user(
    user_create: UserCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) 
):
    """
    Create a new user.
    - Only users with 'administrator' role can create new users.
    - If no role_id is provided, default to 'participant' role.
    """
    user_exists_query = await session.execute(select(User).where(User.email == user_create.email))
    if user_exists_query.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # If role_id is not provided, find the 'participant' role
    if user_create.role_id is None:
        participant_role_query = await session.execute(select(Role).where(Role.name == "participant"))
        participant_role = participant_role_query.scalars().first()
        if not participant_role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Participant role not found in database.")
        user_create.role_id = participant_role.id

    hashed_password = auth.get_password_hash(user_create.password)
    db_user = User(email=user_create.email, hashed_password=hashed_password, role_id=user_create.role_id)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)

    # Eagerly load the role for the response model
    db_user_with_role = await session.execute(
        select(User).where(User.id == db_user.id).options(selectinload(User.role))
    )
    return db_user_with_role.scalars().first()


@router.get("/", response_model=List[UserRead], summary="Get all users (Admin only)")
async def read_users(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Retrieve a list of all users.
    - Only users with 'administrator' role can access this endpoint.
    """
    result = await session.execute(select(User).options(selectinload(User.role)))
    users = result.scalars().all()
    return users

@router.get("/me", response_model=UserRead, summary="Get current user's profile")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve the profile of the currently authenticated user.
    """
    # current_user is already loaded with role from get_current_user dependency
    return current_user

@router.get("/{user_id}", response_model=UserRead, summary="Get a user by ID (Admin only)")
async def read_user_by_id(
    user_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only admin can view a user by ID
):
    """
    Retrieve a single user by their ID.
    - Only users with 'administrator' role can access this endpoint.
    """
    # NEW: Use selectinload to eagerly load the role relationship
    result = await session.execute(
        select(User).where(User.id == user_id).options(selectinload(User.role))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserRead, summary="Update a user by ID (Admin only)")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only admin can update users
):
    """
    Update an existing user by their ID.
    - Only users with 'administrator' role can access this endpoint.
    """
    result = await session.execute(
        select(User).where(User.id == user_id).options(selectinload(User.role))
    )
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a user by ID (Admin only)")
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user) # Only admin can delete users
):
    """
    Delete a user by their ID.
    - Only users with 'administrator' role can access this endpoint.
    """
    result = await session.execute(select(User).where(User.id == user_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    await session.delete(db_user)
    await session.commit()
    return