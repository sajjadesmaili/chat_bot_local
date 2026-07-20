from app.domain.entities.models import Chat
from app.infrastructure.repositories.base import BaseRepository


class ChatRepository(BaseRepository[Chat]):
    model = Chat
