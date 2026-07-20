from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.chat_service import ChatService
from app.application.services.document_service import DocumentService
from app.application.services.log_service import LogService
from app.application.services.message_service import MessageService
from app.application.services.project_service import ProjectService
from app.application.services.provider_service import ProviderService
from app.application.services.rag_service import RagService
from app.application.services.settings_service import SettingsService
from app.application.services.stats_service import StatsService
from app.core.config import settings
from app.domain.entities.models import User
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.database.session import get_session
from app.infrastructure.repositories.chat_repository import ChatRepository
from app.infrastructure.repositories.document_repository import DocumentRepository
from app.infrastructure.repositories.embedding_repository import EmbeddingRepository
from app.infrastructure.repositories.log_repository import LogRepository
from app.infrastructure.repositories.message_repository import MessageRepository
from app.infrastructure.repositories.project_repository import ProjectRepository
from app.infrastructure.repositories.provider_repository import ProviderRepository
from app.infrastructure.repositories.settings_repository import SettingsRepository
from app.infrastructure.repositories.stats_repository import StatsRepository
from app.infrastructure.repositories.user_repository import UserRepository


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


# --- Repositories -----------------------------------------------------------

def get_user_repository(session: DbSession) -> UserRepository:
    return UserRepository(session)


def get_project_repository(session: DbSession) -> ProjectRepository:
    return ProjectRepository(session)


def get_chat_repository(session: DbSession) -> ChatRepository:
    return ChatRepository(session)


def get_message_repository(session: DbSession) -> MessageRepository:
    return MessageRepository(session)


def get_document_repository(session: DbSession) -> DocumentRepository:
    return DocumentRepository(session)


def get_embedding_repository(session: DbSession) -> EmbeddingRepository:
    return EmbeddingRepository(session)


def get_log_repository(session: DbSession) -> LogRepository:
    return LogRepository(session)


def get_settings_repository(session: DbSession) -> SettingsRepository:
    return SettingsRepository(session)


def get_provider_repository(session: DbSession) -> ProviderRepository:
    return ProviderRepository(session)


def get_stats_repository(session: DbSession) -> StatsRepository:
    return StatsRepository(session)


# --- Auth --------------------------------------------------------------------

async def get_current_user(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> User:
    if settings.API_KEY_ENABLED:
        if not x_api_key or x_api_key != settings.API_KEY:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")

    user = await user_repo.get_by_id(settings.DEFAULT_USER_ID)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Default user not initialized"
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# --- Shared singletons -------------------------------------------------------

def get_ai_provider_factory() -> AIProviderFactory:
    return AIProviderFactory()


# --- Services -----------------------------------------------------------------

def get_log_service(repo: Annotated[LogRepository, Depends(get_log_repository)]) -> LogService:
    return LogService(repo)


def get_settings_service(
    repo: Annotated[SettingsRepository, Depends(get_settings_repository)],
) -> SettingsService:
    return SettingsService(repo)


def get_provider_service(
    repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
    factory: Annotated[AIProviderFactory, Depends(get_ai_provider_factory)],
) -> ProviderService:
    return ProviderService(repo, factory)


def get_project_service(
    repo: Annotated[ProjectRepository, Depends(get_project_repository)],
    log_service: Annotated[LogService, Depends(get_log_service)],
) -> ProjectService:
    return ProjectService(repo, log_service)


def get_chat_service(
    repo: Annotated[ChatRepository, Depends(get_chat_repository)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repository)],
    log_service: Annotated[LogService, Depends(get_log_service)],
) -> ChatService:
    return ChatService(repo, project_repo, log_service)


def get_rag_service(
    document_repo: Annotated[DocumentRepository, Depends(get_document_repository)],
    embedding_repo: Annotated[EmbeddingRepository, Depends(get_embedding_repository)],
    settings_service: Annotated[SettingsService, Depends(get_settings_service)],
    ai_factory: Annotated[AIProviderFactory, Depends(get_ai_provider_factory)],
) -> RagService:
    return RagService(document_repo, embedding_repo, settings_service, ai_factory)


def get_document_service(
    repo: Annotated[DocumentRepository, Depends(get_document_repository)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repository)],
    rag_service: Annotated[RagService, Depends(get_rag_service)],
    log_service: Annotated[LogService, Depends(get_log_service)],
) -> DocumentService:
    return DocumentService(repo, project_repo, rag_service, log_service)


def get_message_service(
    message_repo: Annotated[MessageRepository, Depends(get_message_repository)],
    chat_repo: Annotated[ChatRepository, Depends(get_chat_repository)],
    project_repo: Annotated[ProjectRepository, Depends(get_project_repository)],
    settings_service: Annotated[SettingsService, Depends(get_settings_service)],
    rag_service: Annotated[RagService, Depends(get_rag_service)],
    ai_factory: Annotated[AIProviderFactory, Depends(get_ai_provider_factory)],
    log_service: Annotated[LogService, Depends(get_log_service)],
) -> MessageService:
    return MessageService(
        message_repo, chat_repo, project_repo, settings_service, rag_service, ai_factory, log_service
    )


def get_stats_service(
    repo: Annotated[StatsRepository, Depends(get_stats_repository)],
    session: DbSession,
) -> StatsService:
    return StatsService(repo, session)
