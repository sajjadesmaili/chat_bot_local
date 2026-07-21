from abc import ABC, abstractmethod
from typing import Any, Generic, Optional, Sequence, TypeVar

ModelT = TypeVar("ModelT")


class IRepository(ABC, Generic[ModelT]):
    """Generic repository contract implemented by every concrete repository.

    Enforces the Repository Pattern boundary between the application layer
    and the persistence details living in `infrastructure/repositories`.
    """

    @abstractmethod
    async def get_by_id(self, id: int) -> Optional[ModelT]:
        ...

    @abstractmethod
    async def list(
        self, *, page: int = 1, page_size: int = 20, search: Optional[str] = None, **filters: Any
    ) -> tuple[Sequence[ModelT], int]:
        ...

    @abstractmethod
    async def create(self, **data: Any) -> ModelT:
        ...

    @abstractmethod
    async def update(self, id: int, **data: Any) -> Optional[ModelT]:
        ...

    @abstractmethod
    async def soft_delete(self, id: int) -> bool:
        ...
