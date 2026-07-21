from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    model: Optional[str] = None


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chat_id: int
    role: str
    content: str
    model: Optional[str] = None
    provider: Optional[str] = None
    tokens_prompt: Optional[int] = None
    tokens_completion: Optional[int] = None
    context_used: Optional[dict[str, Any]] = None
    created_at: datetime
