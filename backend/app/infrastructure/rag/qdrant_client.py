from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import settings


class QdrantWrapper:
    """Wraps the Qdrant async client with per-project collection isolation.

    Every project gets its own collection (`project_<id>`), so a search or
    delete performed for one project can never leak/touch another project's
    vectors, which is a hard requirement of the RAG design.
    """

    def __init__(self):
        self._client = AsyncQdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)

    @staticmethod
    def _collection_name(project_id: int) -> str:
        return f"project_{project_id}"

    async def ensure_collection(self, project_id: int, vector_size: int) -> None:
        name = self._collection_name(project_id)
        exists = await self._client.collection_exists(name)
        if not exists:
            await self._client.create_collection(
                collection_name=name,
                vectors_config=qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
            )

    async def upsert(self, project_id: int, points: list[tuple[str, list[float], dict]]) -> None:
        if not points:
            return
        name = self._collection_name(project_id)
        qdrant_points = [
            qmodels.PointStruct(id=point_id, vector=vector, payload=payload)
            for point_id, vector, payload in points
        ]
        await self._client.upsert(collection_name=name, points=qdrant_points)

    async def search(self, project_id: int, vector: list[float], top_k: int = 10) -> list[dict]:
        name = self._collection_name(project_id)
        if not await self._client.collection_exists(name):
            return []
        results = await self._client.query_points(
            collection_name=name, query=vector, limit=top_k, with_payload=True
        )
        return [{"score": point.score, "payload": point.payload or {}} for point in results.points]

    async def delete_by_document(self, project_id: int, document_id: int) -> None:
        name = self._collection_name(project_id)
        if not await self._client.collection_exists(name):
            return
        await self._client.delete(
            collection_name=name,
            points_selector=qmodels.FilterSelector(
                filter=qmodels.Filter(
                    must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id))]
                )
            ),
        )

    async def delete_collection(self, project_id: int) -> None:
        name = self._collection_name(project_id)
        if await self._client.collection_exists(name):
            await self._client.delete_collection(name)
