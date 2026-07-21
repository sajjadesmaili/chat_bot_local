from app.domain.entities.models import Log
from app.infrastructure.repositories.base import BaseRepository


class LogRepository(BaseRepository[Log]):
    model = Log
