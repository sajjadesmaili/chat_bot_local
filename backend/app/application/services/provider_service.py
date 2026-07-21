from datetime import datetime, timezone

from app.domain.entities.models import Provider
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.repositories.provider_repository import ProviderRepository

PROVIDER_DISPLAY_NAMES = {"openai": "OpenAI", "ollama": "Ollama (Local)"}


class ProviderService:
    def __init__(self, repo: ProviderRepository, factory: AIProviderFactory):
        self.repo = repo
        self.factory = factory

    async def ensure_catalog(self) -> None:
        for name in self.factory.available_names():
            existing = await self.repo.get_by_name(name)
            if existing is None:
                await self.repo.create(
                    name=name,
                    display_name=PROVIDER_DISPLAY_NAMES.get(name, name),
                    is_enabled=True,
                    is_available=False,
                )
        await self.repo.session.commit()

    async def list_providers(self) -> list[Provider]:
        items, _ = await self.repo.list(page=1, page_size=50)
        return items

    async def detect_providers(self) -> list[dict]:
        """Ping every known provider and refresh its availability + model list."""
        results = []
        for name in self.factory.available_names():
            provider = self.factory.get(name)
            available = await provider.is_available()
            models: list[str] = []
            if available:
                try:
                    models = [m.name for m in await provider.models()]
                except Exception:
                    models = []

            row = await self.repo.get_by_name(name)
            if row is not None:
                row.is_available = available
                row.last_checked_at = datetime.now(timezone.utc)
                await self.repo.session.flush()

            results.append(
                {
                    "name": name,
                    "display_name": PROVIDER_DISPLAY_NAMES.get(name, name),
                    "available": available,
                    "models": models,
                }
            )
        await self.repo.session.commit()
        return results
