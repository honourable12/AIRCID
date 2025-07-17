from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Service configuration
    app_name: str = "AI Case Matching Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Matching configuration
    default_minimum_match_score: float = 0.7
    default_confidence_threshold: float = 0.8
    enable_ml_models: bool = True
    enable_nlp_processing: bool = True
    
    # NLP configuration
    spacy_model: str = "en_core_web_sm"
    nlp_confidence_threshold: float = 0.7
    max_text_length: int = 10000
    
    # Logging configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Security configuration
    enable_cors: bool = True
    cors_origins: list = ["*"]
    
    # Performance configuration
    max_concurrent_requests: int = 100
    request_timeout: int = 30
    
    # External service configuration
    central_backend_url: Optional[str] = None
    emr_integration_url: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings() 