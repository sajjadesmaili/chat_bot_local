from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    ai_provider: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    rag_enabled: bool = True
    system_prompt: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    ai_provider: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    rag_enabled: Optional[bool] = None
    system_prompt: Optional[str] = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    ai_provider: Optional[str] = None
    chat_model: Optional[str] = None
    embedding_model: Optional[str] = None
    rag_enabled: bool
    system_prompt: Optional[str] = None
    created_at: datetime
    updated_at: datetime
