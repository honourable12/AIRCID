# app/core/security.py
from datetime import datetime, timedelta
from typing import Union, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256") # Default to HS256 if not set
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)) # Default to 30 mins

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable not set. Please add it to your .env file.")

def create_access_token(
    data: dict,
    expires_delta: Union[timedelta, None] = None
) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decodes a JWT access token."""
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token
    except JWTError:
        # Handle various JWT errors (e.g., expired token, invalid signature)
        # For simplicity, we'll re-raise, but in a real app, you'd be more specific
        raise