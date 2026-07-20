from app.domain.entities.models import Project
from app.infrastructure.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project
