import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

SECRET_KEY = os.environ.get("JWT_SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

class User(BaseModel):
    id: str = Field(..., description="Unique identifier for the user.")
    username: str = Field(..., description="Username of the user.")
    roles: List[str] = Field(default_factory=list, description="List of roles assigned to the user.")

reusable_oauth2 = HTTPBearer(scheme_name="Bearer")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a new JWT access token.
    Args:
        data (dict): The payload to encode into the token (e.g., user_id, roles).
        expires_delta (Optional[timedelta]): Optional timedelta for token expiration.
    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15) # Default 15 min expiry
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates a JWT access token.
    Args:
        token (str): The JWT string.
    Returns:
        Optional[dict]: The decoded payload if valid, None otherwise.
    Raises:
        HTTPException: If the token is expired, invalid, or decoding fails.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token. Please re-authenticate.")
    except Exception as e:
        # Catch any other unexpected errors during decoding
        raise HTTPException(status_code=500, detail=f"Token decoding error: {e}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(reusable_oauth2)) -> User:
    """
    FastAPI dependency to get the current authenticated user from the JWT.
    Args:
        credentials (HTTPAuthorizationCredentials): Automatically injected by FastAPI from Authorization header.
    Returns:
        User: The authenticated user object.
    Raises:
        HTTPException: If authentication fails.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials. Token is missing or malformed.")

    user_id = payload.get("sub")
    username = payload.get("username")
    roles = payload.get("roles", [])

    if user_id is None or username is None or not isinstance(roles, list):
        raise HTTPException(status_code=401, detail="Invalid token payload. Missing user ID, username, or roles.")
    
    return User(id=user_id, username=username, roles=roles)

def role_required(required_roles: List[str]):
    """
    FastAPI dependency factory to enforce role-based access control.
    Args:
        required_roles (List[str]): A list of roles, at least one of which the user must have.
    Returns:
        Callable: An async dependency function that checks user roles.
    Raises:
        HTTPException: If the user does not have any of the required roles.
    """
    async def _role_checker(current_user: User = Security(get_current_user)):
        if not required_roles:
            return current_user

        if not any(role in required_roles for role in current_user.roles):
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. User '{current_user.username}' does not have any of the required roles: {', '.join(required_roles)}."
            )
        return current_user
    return _role_checker