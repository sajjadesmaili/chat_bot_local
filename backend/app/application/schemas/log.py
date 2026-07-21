from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class LogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level: str
    category: str
    message: str
    meta: Optional[dict[str, Any]] = None
    project_id: Optional[int] = None
    chat_id: Optional[int] = None
    user_id: Optional[int] = None
    created_at: datetime
