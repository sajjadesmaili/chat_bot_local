from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Local AI Chatbot"
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-me-super-secret"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql+asyncpg://chatbot:chatbot@localhost:5432/chatbot"
    DATABASE_ECHO: bool = False

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None

    OLLAMA_URL: str = "http://localhost:11434"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [
        ".pdf", ".docx", ".txt", ".md", ".csv",
        ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h",
        ".go", ".rs", ".json", ".yaml", ".yml", ".html", ".css", ".sql",
    ]

    DEFAULT_AI_PROVIDER: str = "ollama"
    DEFAULT_CHAT_MODEL: str = "qwen3:8b"
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"

    CORS_ORIGINS: str = "http://localhost:3000"

    API_KEY_ENABLED: bool = False
    API_KEY: Optional[str] = None
    DEFAULT_USER_ID: int = 1

    RATE_LIMIT_PER_MINUTE: int = 120

    LOG_LEVEL: str = "INFO"

    RAG_TOP_K: int = 5
    RAG_CONFIDENCE_THRESHOLD: float = 0.55
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
