from collections.abc import AsyncGenerator
from typing import Any, Optional

from openai import AsyncOpenAI

from app.core.config import settings
from app.domain.interfaces.ai_provider import AIProvider, ChatMessage, ChatResult, ModelInfo


class OpenAIProvider(AIProvider):
    """AIProvider implementation backed by the OpenAI-compatible chat/embeddings API."""

    name = "openai"

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self._api_key = api_key or settings.OPENAI_API_KEY
        self._base_url = base_url or settings.OPENAI_BASE_URL
        self._client: Optional[AsyncOpenAI] = None
        if self._api_key:
            self._client = AsyncOpenAI(api_key=self._api_key, base_url=self._base_url)

    def _require_client(self) -> AsyncOpenAI:
        if self._client is None:
            raise RuntimeError("OpenAI provider is not configured: missing OPENAI_API_KEY")
        return self._client

    async def chat(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> ChatResult:
        client = self._require_client()
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            temperature=temperature,
            **kwargs,
        )
        choice = response.choices[0]
        usage = response.usage
        return ChatResult(
            content=choice.message.content or "",
            model=response.model,
            prompt_tokens=getattr(usage, "prompt_tokens", None) if usage else None,
            completion_tokens=getattr(usage, "completion_tokens", None) if usage else None,
            raw=response.model_dump(),
        )

    async def stream(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        client = self._require_client()
        stream = await client.chat.completions.create(
            model=model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            temperature=temperature,
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content

    async def embedding(self, texts: list[str], model: str) -> list[list[float]]:
        client = self._require_client()
        response = await client.embeddings.create(model=model, input=texts)
        return [item.embedding for item in response.data]

    async def models(self) -> list[ModelInfo]:
        client = self._require_client()
        response = await client.models.list()
        return [ModelInfo(name=m.id, provider=self.name) for m in response.data]

    async def is_available(self) -> bool:
        if not self._api_key:
            return False
        try:
            await self.models()
            return True
        except Exception:
            return False
