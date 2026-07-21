from app.domain.interfaces.ai_provider import AIProvider

BATCH_SIZE = 64


class EmbeddingService:
    """Thin batching helper around AIProvider.embedding() for a fixed model."""

    def __init__(self, provider: AIProvider, model: str):
        self.provider = provider
        self.model = model

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), BATCH_SIZE):
            batch = texts[start : start + BATCH_SIZE]
            batch_vectors = await self.provider.embedding(batch, self.model)
            vectors.extend(batch_vectors)
        return vectors

    async def embed_one(self, text: str) -> list[float]:
        vectors = await self.provider.embedding([text], self.model)
        return vectors[0]
