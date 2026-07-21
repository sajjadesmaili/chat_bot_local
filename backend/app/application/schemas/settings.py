from typing import Optional

from pydantic import BaseModel


class SettingsRead(BaseModel):
    ai_provider: str
    chat_model: str
    embedding_model: str
    rag_enabled: bool
    rag_top_k: int
    rag_confidence_threshold: float
    temperature: float
    chunk_size: int
    chunk_overlap: int


class SettingsUpdate(BaseModel):
    ai_provider: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    rag_enabled: Optional[bool] = None
    rag_top_k: Optional[int] = None
    rag_confidence_threshold: Optional[float] = None
    temperature: Optional[float] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
