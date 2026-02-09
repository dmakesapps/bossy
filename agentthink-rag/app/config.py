"""
Configuration module using Pydantic Settings.
Reads from environment variables with sensible defaults.
"""

import json
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Qdrant Configuration
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    
    # Embedding Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Chunking Configuration
    CHUNK_SIZE: int = 512  # Target size in tokens
    CHUNK_OVERLAP: int = 50  # Overlap in tokens
    
    # File Upload Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "csv", "txt", "md"]
    
    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        """Parse ALLOWED_EXTENSIONS from JSON string if needed."""
        if isinstance(v, str):
            return json.loads(v)
        return v
    
    @property
    def max_file_size_bytes(self) -> int:
        """Return max file size in bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def chunk_size_chars(self) -> int:
        """Return chunk size in characters (approx 4 chars per token)."""
        return self.CHUNK_SIZE * 4
    
    @property
    def chunk_overlap_chars(self) -> int:
        """Return chunk overlap in characters."""
        return self.CHUNK_OVERLAP * 4
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache ensures settings are only loaded once.
    """
    return Settings()
