from dataclasses import dataclass

from app.infrastructure.rag.embeddings import EmbeddingService
from app.infrastructure.rag.qdrant_client import QdrantWrapper
from app.infrastructure.repositories.embedding_repository import EmbeddingRepository

SEMANTIC_WEIGHT = 0.7
KEYWORD_WEIGHT = 0.3


@dataclass
class RetrievedChunk:
    content: str
    score: float
    filename: str
    chunk_index: int


class HybridRetriever:
    """Combines semantic (Qdrant vector) search with keyword (Postgres ILIKE)
    search and merges the two into a single ranked, confidence-scored list.

    If the top combined score is below the caller's confidence threshold, an
    empty list is returned so the caller can fall back to the "couldn't find
    this information" response instead of guessing.
    """

    def __init__(self, qdrant: QdrantWrapper, embedding_repo: EmbeddingRepository, embedding_service: EmbeddingService):
        self.qdrant = qdrant
        self.embedding_repo = embedding_repo
        self.embedding_service = embedding_service

    async def retrieve(
        self, project_id: int, query: str, top_k: int, confidence_threshold: float
    ) -> tuple[list[RetrievedChunk], float]:
        try:
            query_vector = await self.embedding_service.embed_one(query)
        except Exception:
            query_vector = None

        semantic_hits: dict[int, tuple[float, dict]] = {}
        if query_vector is not None:
            hits = await self.qdrant.search(project_id, query_vector, top_k=top_k * 2)
            for hit in hits:
                embedding_id = hit["payload"].get("embedding_id")
                if embedding_id is not None:
                    semantic_hits[int(embedding_id)] = (float(hit["score"]), hit["payload"])

        keyword_hits = await self.embedding_repo.keyword_search(project_id, query, limit=top_k * 2)

        combined: dict[int, dict] = {}
        for embedding_id, (score, payload) in semantic_hits.items():
            normalized = max(0.0, min(1.0, (score + 1) / 2))
            combined[embedding_id] = {
                "score": SEMANTIC_WEIGHT * normalized,
                "content": payload.get("content", ""),
                "filename": payload.get("filename", ""),
                "chunk_index": payload.get("chunk_index", 0),
            }

        for row, keyword_score in keyword_hits:
            entry = combined.get(row.id)
            filename = row.document.filename if row.document else ""
            if entry is None:
                combined[row.id] = {
                    "score": KEYWORD_WEIGHT * keyword_score,
                    "content": row.content,
                    "filename": filename,
                    "chunk_index": row.chunk_index,
                }
            else:
                entry["score"] += KEYWORD_WEIGHT * keyword_score

        ranked = sorted(combined.values(), key=lambda item: item["score"], reverse=True)[:top_k]
        confidence = ranked[0]["score"] if ranked else 0.0

        if not ranked or confidence < confidence_threshold:
            return [], confidence

        chunks = [
            RetrievedChunk(item["content"], item["score"], item["filename"], item["chunk_index"])
            for item in ranked
        ]
        return chunks, confidence
