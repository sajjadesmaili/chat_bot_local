from typing import Any

from app.core.config import settings as app_config
from app.infrastructure.repositories.settings_repository import SettingsRepository

DEFAULT_KEYS: dict[str, Any] = {
    "ai_provider": app_config.DEFAULT_AI_PROVIDER,
    "chat_model": app_config.DEFAULT_CHAT_MODEL,
    "embedding_model": app_config.DEFAULT_EMBEDDING_MODEL,
    "rag_enabled": True,
    "rag_top_k": app_config.RAG_TOP_K,
    "rag_confidence_threshold": app_config.RAG_CONFIDENCE_THRESHOLD,
    "temperature": 0.7,
    "chunk_size": app_config.CHUNK_SIZE,
    "chunk_overlap": app_config.CHUNK_OVERLAP,
}


class SettingsService:
    """Global, DB-backed settings (provider/model/RAG params) with sane defaults.

    Reading/writing goes through the `settings` table so the active provider
    and model can be changed at runtime (e.g. via PATCH /api/v1/settings)
    without restarting the app.
    """

    def __init__(self, repo: SettingsRepository):
        self.repo = repo

    async def ensure_defaults(self) -> None:
        for key, value in DEFAULT_KEYS.items():
            existing = await self.repo.get_by_key(key)
            if existing is None:
                await self.repo.create(key=key, value={"value": value})
        await self.repo.session.commit()

    async def get_settings(self) -> dict[str, Any]:
        rows = await self.repo.get_all()
        result = dict(DEFAULT_KEYS)
        for row in rows:
            if row.value is not None and "value" in row.value:
                result[row.key] = row.value["value"]
        return result

    async def update_settings(self, updates: dict[str, Any]) -> dict[str, Any]:
        for key, value in updates.items():
            if value is None or key not in DEFAULT_KEYS:
                continue
            await self.repo.upsert(key, {"value": value})
        await self.repo.session.commit()
        return await self.get_settings()
