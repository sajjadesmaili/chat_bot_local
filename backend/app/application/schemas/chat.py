from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)


class ChatUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    created_at: datetime
    updated_at: datetime
