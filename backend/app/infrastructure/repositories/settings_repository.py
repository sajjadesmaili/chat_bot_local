from typing import Any, Optional

from app.domain.entities.models import Setting
from app.infrastructure.repositories.base import BaseRepository


class SettingsRepository(BaseRepository[Setting]):
    model = Setting

    async def get_by_key(self, key: str) -> Optional[Setting]:
        stmt = self._base_query().where(Setting.key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Setting]:
        stmt = self._base_query()
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert(self, key: str, value: dict[str, Any]) -> Setting:
        existing = await self.get_by_key(key)
        if existing is not None:
            existing.value = value
            await self.session.flush()
            return existing
        return await self.create(key=key, value=value)
