# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    # Model_config is used for Pydantic v2+ to specify settings source
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore" # Ignore extra fields in .env not defined here
    )

    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key_change_this") # Provide a default for local dev, but use env var in prod
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = Settings()