from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.models import Statistic
from app.infrastructure.repositories.stats_repository import StatsRepository


class StatsService:
    def __init__(self, repo: StatsRepository, session: AsyncSession):
        self.repo = repo
        self.session = session

    async def get_overview(self, project_id: Optional[int] = None, persist: bool = True) -> dict:
        data = await self.repo.overview(project_id)
        if persist:
            snapshot = Statistic(
                project_id=project_id,
                total_messages=data["total_messages"],
                total_chats=data["total_chats"],
                total_documents=data["total_documents"],
                total_tokens_prompt=data["total_tokens_prompt"],
                total_tokens_completion=data["total_tokens_completion"],
                provider_usage=data["provider_usage"],
            )
            self.session.add(snapshot)
            await self.session.commit()
        return data
