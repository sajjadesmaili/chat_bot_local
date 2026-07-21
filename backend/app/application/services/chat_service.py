from typing import Optional

from app.application.services.log_service import LogService
from app.core.exceptions import NotFoundException
from app.domain.entities.models import Chat, LogCategory, LogLevel, Project
from app.infrastructure.repositories.chat_repository import ChatRepository
from app.infrastructure.repositories.project_repository import ProjectRepository


class ChatService:
    def __init__(self, repo: ChatRepository, project_repo: ProjectRepository, log_service: LogService):
        self.repo = repo
        self.project_repo = project_repo
        self.log_service = log_service

    async def _get_project_or_404(self, project_id: int) -> Project:
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise NotFoundException(f"Project {project_id} not found")
        return project

    async def list_chats(self, project_id: int, page: int, page_size: int, search: Optional[str]):
        await self._get_project_or_404(project_id)
        return await self.repo.list(
            page=page, page_size=page_size, search=search, search_fields=["title"], project_id=project_id
        )

    async def get_chat(self, chat_id: int) -> Chat:
        chat = await self.repo.get_by_id(chat_id)
        if chat is None:
            raise NotFoundException(f"Chat {chat_id} not found")
        return chat

    async def create_chat(self, project_id: int, title: Optional[str]) -> Chat:
        await self._get_project_or_404(project_id)
        chat = await self.repo.create(project_id=project_id, title=title or "New Chat")
        await self.repo.session.commit()
        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.CHAT,
            message=f"Chat '{chat.title}' created",
            project_id=project_id,
            chat_id=chat.id,
        )
        return chat

    async def update_chat(self, chat_id: int, title: str) -> Chat:
        chat = await self.repo.update(chat_id, title=title)
        if chat is None:
            raise NotFoundException(f"Chat {chat_id} not found")
        await self.repo.session.commit()
        return chat

    async def delete_chat(self, chat_id: int) -> None:
        ok = await self.repo.soft_delete(chat_id)
        if not ok:
            raise NotFoundException(f"Chat {chat_id} not found")
        await self.repo.session.commit()
