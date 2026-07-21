import uuid

from app.application.services.settings_service import SettingsService
from app.domain.entities.models import Document
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.rag.chunker import chunk_text
from app.infrastructure.rag.document_parser import parse_document
from app.infrastructure.rag.embeddings import EmbeddingService
from app.infrastructure.rag.qdrant_client import QdrantWrapper
from app.infrastructure.rag.retriever import HybridRetriever, RetrievedChunk
from app.infrastructure.repositories.document_repository import DocumentRepository
from app.infrastructure.repositories.embedding_repository import EmbeddingRepository


class RagService:
    """Orchestrates the full RAG pipeline: Upload -> Chunk -> Embed -> Store ->
    Retrieve, with strict per-project isolation (separate Qdrant collection
    per project, and every query scoped by project_id)."""

    def __init__(
        self,
        document_repo: DocumentRepository,
        embedding_repo: EmbeddingRepository,
        settings_service: SettingsService,
        ai_factory: AIProviderFactory,
    ):
        self.document_repo = document_repo
        self.embedding_repo = embedding_repo
        self.settings_service = settings_service
        self.ai_factory = ai_factory
        self.qdrant = QdrantWrapper()

    async def ingest_document(self, document: Document) -> int:
        text = parse_document(document.file_path, document.file_type)
        if not text.strip():
            raise ValueError("Document contains no extractable text")

        app_settings = await self.settings_service.get_settings()
        chunks = chunk_text(
            text, chunk_size=app_settings["chunk_size"], chunk_overlap=app_settings["chunk_overlap"]
        )
        if not chunks:
            raise ValueError("Document produced no chunks")

        provider = self.ai_factory.get(app_settings["ai_provider"])
        embedding_model = app_settings["embedding_model"]
        embedding_service = EmbeddingService(provider, embedding_model)
        vectors = await embedding_service.embed_many(chunks)

        await self.qdrant.ensure_collection(document.project_id, len(vectors[0]))
        await self.embedding_repo.delete_by_document(document.id)

        points: list[tuple[str, list[float], dict]] = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            vector_id = str(uuid.uuid4())
            embedding_row = await self.embedding_repo.create(
                document_id=document.id,
                project_id=document.project_id,
                chunk_index=idx,
                content=chunk,
                vector_id=vector_id,
                embedding_model=embedding_model,
                token_count=len(chunk.split()),
            )
            points.append(
                (
                    vector_id,
                    vector,
                    {
                        "project_id": document.project_id,
                        "document_id": document.id,
                        "embedding_id": embedding_row.id,
                        "chunk_index": idx,
                        "filename": document.filename,
                        "content": chunk,
                    },
                )
            )

        await self.qdrant.upsert(document.project_id, points)
        await self.embedding_repo.session.commit()
        return len(chunks)

    async def retrieve_context(
        self, project_id: int, query: str, top_k: int, confidence_threshold: float
    ) -> tuple[list[RetrievedChunk], float]:
        app_settings = await self.settings_service.get_settings()
        provider = self.ai_factory.get(app_settings["ai_provider"])
        embedding_service = EmbeddingService(provider, app_settings["embedding_model"])
        retriever = HybridRetriever(self.qdrant, self.embedding_repo, embedding_service)
        return await retriever.retrieve(project_id, query, top_k, confidence_threshold)

    async def delete_document_vectors(self, project_id: int, document_id: int) -> None:
        await self.qdrant.delete_by_document(project_id, document_id)
        await self.embedding_repo.delete_by_document(document_id)
