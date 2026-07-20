from typing import Optional

from app.domain.entities.models import Provider
from app.infrastructure.repositories.base import BaseRepository


class ProviderRepository(BaseRepository[Provider]):
    model = Provider

    async def get_by_name(self, name: str) -> Optional[Provider]:
        stmt = self._base_query().where(Provider.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
