import json
from collections.abc import AsyncGenerator
from typing import Any, Optional

from app.application.services.log_service import LogService
from app.application.services.rag_service import RagService
from app.application.services.settings_service import SettingsService
from app.core.exceptions import NotFoundException, ProviderException
from app.domain.entities.models import Chat, LogCategory, LogLevel, Message, MessageRole, Project
from app.domain.interfaces.ai_provider import ChatMessage
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.repositories.chat_repository import ChatRepository
from app.infrastructure.repositories.message_repository import MessageRepository
from app.infrastructure.repositories.project_repository import ProjectRepository

FALLBACK_MESSAGE = "I couldn't find this information in the project."
DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful assistant for this project. Answer clearly and concisely. "
    "If context from project documents is provided below, ground your answer in it "
    "and say when it isn't sufficient to fully answer."
)
HISTORY_LIMIT = 10


class MessageService:
    """Handles message CRUD plus the full chat/RAG/LLM orchestration used by
    both the regular and the SSE streaming endpoints."""

    def __init__(
        self,
        message_repo: MessageRepository,
        chat_repo: ChatRepository,
        project_repo: ProjectRepository,
        settings_service: SettingsService,
        rag_service: RagService,
        ai_factory: AIProviderFactory,
        log_service: LogService,
    ):
        self.message_repo = message_repo
        self.chat_repo = chat_repo
        self.project_repo = project_repo
        self.settings_service = settings_service
        self.rag_service = rag_service
        self.ai_factory = ai_factory
        self.log_service = log_service

    async def list_messages(self, chat_id: int, page: int, page_size: int):
        await self._get_chat_and_project(chat_id)
        return await self.message_repo.list(
            page=page, page_size=page_size, chat_id=chat_id, order_by=Message.created_at.asc()
        )

    async def _get_chat_and_project(self, chat_id: int) -> tuple[Chat, Project]:
        chat = await self.chat_repo.get_by_id(chat_id)
        if chat is None:
            raise NotFoundException(f"Chat {chat_id} not found")
        project = await self.project_repo.get_by_id(chat.project_id)
        if project is None:
            raise NotFoundException(f"Project for chat {chat_id} not found")
        return chat, project

    async def _resolve_settings(self, project: Project) -> dict[str, Any]:
        global_settings = await self.settings_service.get_settings()
        return {
            "ai_provider": project.ai_provider or global_settings["ai_provider"],
            "chat_model": project.chat_model or global_settings["chat_model"],
            "embedding_model": project.embedding_model or global_settings["embedding_model"],
            "rag_enabled": project.rag_enabled if project.rag_enabled is not None else global_settings["rag_enabled"],
            "rag_top_k": global_settings["rag_top_k"],
            "rag_confidence_threshold": global_settings["rag_confidence_threshold"],
            "temperature": global_settings["temperature"],
            "system_prompt": project.system_prompt or DEFAULT_SYSTEM_PROMPT,
        }

    async def _build_context(
        self, project: Project, query: str, effective: dict[str, Any]
    ) -> tuple[Optional[str], Optional[dict], bool]:
        """Returns (context_text, context_meta, fallback_required)."""
        if not effective["rag_enabled"]:
            return None, None, False

        chunks, confidence = await self.rag_service.retrieve_context(
            project.id, query, top_k=effective["rag_top_k"], confidence_threshold=effective["rag_confidence_threshold"]
        )

        if chunks:
            context_text = "\n\n".join(f"[Source: {c.filename}]\n{c.content}" for c in chunks)
            context_meta = {"confidence": confidence, "sources": [c.filename for c in chunks]}
            return context_text, context_meta, False

        _, total_docs = await self.rag_service.document_repo.list(page=1, page_size=1, project_id=project.id)
        context_meta = {"confidence": confidence, "sources": []}
        fallback = total_docs > 0
        return None, context_meta, fallback

    async def _history_messages(self, chat_id: int) -> list[ChatMessage]:
        rows, _ = await self.message_repo.list(
            page=1, page_size=HISTORY_LIMIT, chat_id=chat_id, order_by=Message.created_at.desc()
        )
        history = list(reversed(rows))
        return [ChatMessage(role=row.role.value, content=row.content) for row in history]

    def _build_prompt_messages(
        self, effective: dict[str, Any], history: list[ChatMessage], context_text: Optional[str], user_content: str
    ) -> list[ChatMessage]:
        messages = [ChatMessage(role="system", content=effective["system_prompt"])]
        if context_text:
            messages.append(ChatMessage(role="system", content=f"Relevant project context:\n{context_text}"))
        messages.extend(history)
        messages.append(ChatMessage(role="user", content=user_content))
        return messages

    async def send_message(self, chat_id: int, content: str, model_override: Optional[str] = None) -> Message:
        chat, project = await self._get_chat_and_project(chat_id)
        effective = await self._resolve_settings(project)
        model = model_override or effective["chat_model"]

        await self.message_repo.create(chat_id=chat_id, role=MessageRole.USER, content=content)
        await self.message_repo.session.commit()

        context_text, context_meta, fallback = await self._build_context(project, content, effective)

        if fallback:
            assistant_message = await self.message_repo.create(
                chat_id=chat_id,
                role=MessageRole.ASSISTANT,
                content=FALLBACK_MESSAGE,
                model="rag-fallback",
                provider=effective["ai_provider"],
                context_used=context_meta,
            )
            await self.message_repo.session.commit()
            await self.log_service.log(
                level=LogLevel.INFO,
                category=LogCategory.CHAT,
                message="RAG fallback returned (low confidence)",
                project_id=project.id,
                chat_id=chat_id,
                meta=context_meta,
            )
            return assistant_message

        history = await self._history_messages(chat_id)
        prompt_messages = self._build_prompt_messages(effective, history[:-1] if history else [], context_text, content)

        provider = self.ai_factory.get(effective["ai_provider"])
        try:
            result = await provider.chat(prompt_messages, model, temperature=effective["temperature"])
        except Exception as exc:  # noqa: BLE001
            await self.log_service.log(
                level=LogLevel.ERROR,
                category=LogCategory.PROVIDER,
                message=f"Chat call failed: {exc}",
                project_id=project.id,
                chat_id=chat_id,
                meta={"provider": effective["ai_provider"], "model": model},
            )
            raise ProviderException(f"AI provider '{effective['ai_provider']}' failed: {exc}")

        assistant_message = await self.message_repo.create(
            chat_id=chat_id,
            role=MessageRole.ASSISTANT,
            content=result.content,
            model=result.model,
            provider=effective["ai_provider"],
            tokens_prompt=result.prompt_tokens,
            tokens_completion=result.completion_tokens,
            context_used=context_meta,
        )
        await self.message_repo.session.commit()

        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.CHAT,
            message="Chat message answered",
            project_id=project.id,
            chat_id=chat_id,
            meta={
                "provider": effective["ai_provider"],
                "model": model,
                "prompt_tokens": result.prompt_tokens,
                "completion_tokens": result.completion_tokens,
            },
        )
        return assistant_message

    async def stream_message(
        self, chat_id: int, content: str, model_override: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        chat, project = await self._get_chat_and_project(chat_id)
        effective = await self._resolve_settings(project)
        model = model_override or effective["chat_model"]

        await self.message_repo.create(chat_id=chat_id, role=MessageRole.USER, content=content)
        await self.message_repo.session.commit()

        context_text, context_meta, fallback = await self._build_context(project, content, effective)

        if fallback:
            assistant_message = await self.message_repo.create(
                chat_id=chat_id,
                role=MessageRole.ASSISTANT,
                content=FALLBACK_MESSAGE,
                model="rag-fallback",
                provider=effective["ai_provider"],
                context_used=context_meta,
            )
            await self.message_repo.session.commit()
            await self.log_service.log(
                level=LogLevel.INFO,
                category=LogCategory.CHAT,
                message="RAG fallback returned (low confidence)",
                project_id=project.id,
                chat_id=chat_id,
                meta=context_meta,
            )
            yield _sse({"type": "chunk", "content": FALLBACK_MESSAGE})
            yield _sse({"type": "done", "message_id": assistant_message.id})
            return

        history = await self._history_messages(chat_id)
        prompt_messages = self._build_prompt_messages(effective, history[:-1] if history else [], context_text, content)
        provider = self.ai_factory.get(effective["ai_provider"])

        full_text = ""
        try:
            async for delta in provider.stream(prompt_messages, model, temperature=effective["temperature"]):
                full_text += delta
                yield _sse({"type": "chunk", "content": delta})
        except Exception as exc:  # noqa: BLE001
            await self.log_service.log(
                level=LogLevel.ERROR,
                category=LogCategory.PROVIDER,
                message=f"Streaming chat call failed: {exc}",
                project_id=project.id,
                chat_id=chat_id,
                meta={"provider": effective["ai_provider"], "model": model},
            )
            yield _sse({"type": "error", "detail": str(exc)})
            return

        assistant_message = await self.message_repo.create(
            chat_id=chat_id,
            role=MessageRole.ASSISTANT,
            content=full_text,
            model=model,
            provider=effective["ai_provider"],
            context_used=context_meta,
        )
        await self.message_repo.session.commit()

        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.CHAT,
            message="Streaming chat message answered",
            project_id=project.id,
            chat_id=chat_id,
            meta={"provider": effective["ai_provider"], "model": model},
        )
        yield _sse({"type": "done", "message_id": assistant_message.id})


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"
