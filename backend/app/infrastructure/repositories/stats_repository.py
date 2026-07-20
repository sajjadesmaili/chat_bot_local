from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.models import Chat, Document, Log, Message, Project


class StatsRepository:
    """Read-only aggregation queries across multiple tables for the stats endpoint."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _count(self, model, **filters) -> int:
        stmt = select(func.count()).select_from(model).where(model.deleted_at.is_(None))
        for key, value in filters.items():
            stmt = stmt.where(getattr(model, key) == value)
        return (await self.session.execute(stmt)).scalar_one()

    async def overview(self, project_id: Optional[int] = None) -> dict:
        project_filter = {"project_id": project_id} if project_id else {}

        total_projects = 1 if project_id else await self._count(Project)
        total_chats = await self._count(Chat, **project_filter)
        total_documents = await self._count(Document, **project_filter)

        message_stmt = (
            select(
                func.count(Message.id),
                func.coalesce(func.sum(Message.tokens_prompt), 0),
                func.coalesce(func.sum(Message.tokens_completion), 0),
            )
            .join(Chat, Message.chat_id == Chat.id)
            .where(Message.deleted_at.is_(None))
        )
        if project_id:
            message_stmt = message_stmt.where(Chat.project_id == project_id)
        total_messages, tokens_prompt, tokens_completion = (
            await self.session.execute(message_stmt)
        ).one()

        provider_stmt = (
            select(Message.provider, func.count(Message.id))
            .join(Chat, Message.chat_id == Chat.id)
            .where(Message.deleted_at.is_(None), Message.provider.is_not(None))
            .group_by(Message.provider)
        )
        if project_id:
            provider_stmt = provider_stmt.where(Chat.project_id == project_id)
        provider_rows = (await self.session.execute(provider_stmt)).all()

        log_stmt = select(Log.level, func.count(Log.id)).where(Log.deleted_at.is_(None))
        if project_id:
            log_stmt = log_stmt.where(Log.project_id == project_id)
        log_stmt = log_stmt.group_by(Log.level)
        log_rows = (await self.session.execute(log_stmt)).all()

        return {
            "total_projects": total_projects,
            "total_chats": total_chats,
            "total_documents": total_documents,
            "total_messages": total_messages or 0,
            "total_tokens_prompt": tokens_prompt or 0,
            "total_tokens_completion": tokens_completion or 0,
            "provider_usage": {name: count for name, count in provider_rows},
            "logs_by_level": {level.value: count for level, count in log_rows},
        }
