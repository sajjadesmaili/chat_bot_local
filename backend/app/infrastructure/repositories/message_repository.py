from app.domain.entities.models import Message
from app.infrastructure.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    model = Message
