# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from sqlalchemy.orm import selectinload # Ensure this is imported

from app.core.database import get_async_session
# Import dependencies directly as they are already Depends objects
from app.api.dependencies.auth import get_current_user, get_admin_user, get_researcher_or_admin_user
from app.models.user import User, UserRead, UserUpdate
from app.models.role import RoleRead # For response model if needed

router = APIRouter()

@router.get("/me", response_model=UserRead, summary="Get current authenticated user's details")
async def read_current_user(
    current_user: User = Depends(get_current_user) # This is correct
):
    """
    Retrieve details of the currently authenticated user.
    """
    return current_user

@router.get("/", response_model=List[UserRead], summary="Get all users (Admin only)")
async def read_users(
    session: AsyncSession = Depends(get_async_session),
    # CORRECTED LINE: Use get_admin_user directly, it's already a Depends object
    current_admin_user: User = get_admin_user
):
    """
    Retrieve a list of all users. This endpoint is restricted to 'administrator' roles.
    """
    users_query = await session.execute(select(User))
    users = users_query.scalars().all()
    return users

@router.put("/{user_id}", response_model=UserRead, summary="Update user details (Admin/Self-update)")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user) # This is correct
):
    """
    Update details for a specific user.
    Admins can update any user; non-admins can only update their own profile.
    """
    target_user_query = await session.execute(select(User).where(User.id == user_id))
    target_user = target_user_query.scalars().first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Load current user's role if not already loaded (for RBAC)
    # The RoleChecker already handles loading the role for get_admin_user / get_researcher_or_admin_user
    # But for get_current_user alone, we might need it if we're checking role here.
    # It's safer to always ensure the role is loaded if you're going to access it here.
    # The previous logic was correct here.
    current_user_with_role = await session.execute(
        select(User).where(User.id == current_user.id).options(selectinload(User.role))
    )
    current_user_fully_loaded = current_user_with_role.scalars().first()

    # Authorization logic: Admin can update anyone, non-admin can only update themselves
    if current_user_fully_loaded.role and current_user_fully_loaded.role.name == "administrator":
        pass # Admin can proceed
    elif current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's profile"
        )

    # Apply updates
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password": # Handle password hashing if provided
            target_user.hashed_password = app.core.security.get_password_hash(value)
        else:
            setattr(target_user, key, value)

    session.add(target_user)
    await session.commit()
    await session.refresh(target_user)
    return target_user