from app.domain.entities.models import Document
from app.infrastructure.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    model = Document
