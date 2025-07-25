# app/api/dependencies/auth.py
from typing import Generator, Annotated, Optional
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError

from app.core.database import get_async_session
from app.core.security import SECRET_KEY, ALGORITHM, decode_access_token
from app.models.user import User
from app.models.role import Role
from sqlalchemy.orm import selectinload

# OAuth2 scheme for bearer tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(
    session: AsyncSession = Depends(get_async_session),
    token: str = Security(oauth2_scheme)
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.
    Raises HTTPException if the token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token) # Uses our decode_access_token from app.core.security
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except JWTError: # Specific JWT errors are caught by decode_access_token and re-raised as JWTError
        raise credentials_exception

    user_query = await session.execute(select(User).where(User.email == user_email))
    user = user_query.scalars().first()

    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    """
    A class-based dependency to check user roles.
    Usage: Depends(RoleChecker(["admin", "researcher"]))
    """
    def __init__(self, allowed_roles: Optional[list[str]] = None):
        self.allowed_roles = allowed_roles if allowed_roles is not None else []

    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_async_session)
    ):
        if not self.allowed_roles:
            return # No specific roles required, so any authenticated user is fine

        # Eagerly load the role relationship if not already loaded
        if not current_user.role:
            user_with_role = await session.execute(
                select(User).where(User.id == current_user.id)
                .options(selectinload(User.role))
            )
            current_user = user_with_role.scalars().first()
            if not current_user or not current_user.role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role information not available."
                )

        if current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user # Return the user if authorized

# Helper for common dependencies
get_admin_user = Depends(RoleChecker(["administrator"]))
get_researcher_or_admin_user = Depends(RoleChecker(["researcher", "administrator"]))