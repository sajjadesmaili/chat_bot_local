from typing import Optional

from app.domain.entities.models import User
from app.infrastructure.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = self._base_query().where(User.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> Optional[User]:
        stmt = self._base_query().where(User.api_key == api_key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
