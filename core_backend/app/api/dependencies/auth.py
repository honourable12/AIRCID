from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User
from app.models.role import RoleName # Ensure RoleName enum is imported

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token
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
    
    user_query = await session.execute(select(User).where(User.email == username))
    user = user_query.scalars().first()
    
    if user is None:
        raise credentials_exception
    
    # Eagerly load the role to avoid lazy loading issues later
    user_with_role_query = await session.execute(
        select(User).where(User.email == username).options(selectinload(User.role))
    )
    user_with_role = user_with_role_query.scalars().first()

    if not user_with_role.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return user_with_role

async def get_researcher_or_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if the current user is a researcher or an administrator."""
    if not current_user.role or current_user.role.name not in [RoleName.researcher, RoleName.administrator]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires researcher or administrator role"
        )
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to check if the current user is an administrator."""
    if not current_user.role or current_user.role.name != RoleName.administrator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Requires administrator role"
        )
    return current_user