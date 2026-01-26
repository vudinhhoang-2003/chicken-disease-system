"""Application configuration using Pydantic Settings"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str = "postgresql://admin:admin123@localhost:5432/chicken_disease"
    
    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    
    # Google Gemini API
    google_api_key: str = ""
    
    # App Settings
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # Model Paths
    detection_model_path: str = "model_store/detection_best.pt"
    classification_model_path: str = "model_store/classification_best.pt"
    
    # Demo Video
    demo_video_path: str = "demo_videos/chicken_farm.mp4"
    
    # CORS
    cors_origins: list[str] = ["*"]

    # Security (JWT)
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 8 # 8 days

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
