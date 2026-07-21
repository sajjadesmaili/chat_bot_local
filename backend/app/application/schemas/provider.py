from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProviderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    display_name: str
    is_enabled: bool
    is_available: bool
    last_checked_at: Optional[datetime] = None


class ProviderDetectResult(BaseModel):
    name: str
    display_name: str
    available: bool
    models: list[str]
