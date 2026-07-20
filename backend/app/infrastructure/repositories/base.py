from datetime import datetime, timezone
from typing import Any, Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.models import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic async repository providing CRUD, soft delete, pagination and search.

    Concrete repositories only need to set `model = <SQLAlchemy model>` and may
    add domain-specific query methods on top of this base behaviour.
    """

    model: Type[ModelT]

    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self):
        return select(self.model).where(self.model.deleted_at.is_(None))

    async def get_by_id(self, id: int) -> Optional[ModelT]:
        stmt = self._base_query().where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        search_fields: Optional[list[str]] = None,
        order_by: Optional[Any] = None,
        **filters: Any,
    ) -> tuple[Sequence[ModelT], int]:
        stmt = self._base_query()

        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)

        if search and search_fields:
            conditions = [
                getattr(self.model, field).ilike(f"%{search}%")
                for field in search_fields
                if hasattr(self.model, field)
            ]
            if conditions:
                stmt = stmt.where(or_(*conditions))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(order_by if order_by is not None else self.model.id.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.session.execute(stmt)
        items = result.scalars().all()
        return items, total

    async def create(self, **data: Any) -> ModelT:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: int, **data: Any) -> Optional[ModelT]:
        obj = await self.get_by_id(id)
        if obj is None:
            return None
        for key, value in data.items():
            if value is not None and hasattr(obj, key):
                setattr(obj, key, value)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def soft_delete(self, id: int) -> bool:
        obj = await self.get_by_id(id)
        if obj is None:
            return False
        obj.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()
        return True

    async def hard_delete(self, id: int) -> bool:
        obj = await self.get_by_id(id)
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.flush()
        return True
