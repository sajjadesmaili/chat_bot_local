from sqlalchemy import case, or_, select
from sqlalchemy.orm import selectinload

from app.domain.entities.models import Embedding
from app.infrastructure.repositories.base import BaseRepository


class EmbeddingRepository(BaseRepository[Embedding]):
    model = Embedding

    async def keyword_search(
        self, project_id: int, query: str, limit: int = 10
    ) -> list[tuple[Embedding, float]]:
        """Simple ILIKE-based keyword search, ranked by how many query words match.

        Returns a list of (embedding_row, normalized_score) where score is in [0, 1].
        """
        words = [w.strip() for w in query.split() if w.strip()]
        if not words:
            return []

        like_conditions = [Embedding.content.ilike(f"%{w}%") for w in words]
        match_terms = [case((Embedding.content.ilike(f"%{w}%"), 1), else_=0) for w in words]
        score_column = match_terms[0]
        for term in match_terms[1:]:
            score_column = score_column + term

        stmt = (
            select(Embedding, score_column.label("match_score"))
            .options(selectinload(Embedding.document))
            .where(
                Embedding.deleted_at.is_(None),
                Embedding.project_id == project_id,
                or_(*like_conditions),
            )
            .order_by(score_column.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        total_words = len(words)
        return [(row[0], row[1] / total_words if total_words else 0.0) for row in rows]

    async def delete_by_document(self, document_id: int) -> None:
        stmt = select(Embedding).where(Embedding.document_id == document_id)
        result = await self.session.execute(stmt)
        for row in result.scalars().all():
            await self.session.delete(row)
        await self.session.flush()
