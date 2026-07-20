from typing import Any, Optional

from app.domain.entities.models import LogCategory, LogLevel
from app.infrastructure.repositories.log_repository import LogRepository


class LogService:
    """Persists application events (prompts, responses, model usage, errors).

    Commits immediately so log entries survive even if the caller's broader
    transaction later rolls back.
    """

    def __init__(self, repo: LogRepository):
        self.repo = repo

    async def log(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        meta: Optional[dict[str, Any]] = None,
        project_id: Optional[int] = None,
        chat_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> None:
        await self.repo.create(
            level=level,
            category=category,
            message=message,
            meta=meta,
            project_id=project_id,
            chat_id=chat_id,
            user_id=user_id,
        )
        await self.repo.session.commit()

    async def list_logs(
        self,
        page: int,
        page_size: int,
        level: Optional[str] = None,
        category: Optional[str] = None,
        project_id: Optional[int] = None,
    ):
        return await self.repo.list(
            page=page,
            page_size=page_size,
            order_by=self.repo.model.created_at.desc(),
            level=level,
            category=category,
            project_id=project_id,
        )
