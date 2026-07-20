import json
from collections.abc import AsyncGenerator
from typing import Any, Optional

import httpx

from app.core.config import settings
from app.domain.interfaces.ai_provider import AIProvider, ChatMessage, ChatResult, ModelInfo


class OllamaProvider(AIProvider):
    """AIProvider implementation backed by a local Ollama server."""

    name = "ollama"

    def __init__(self, base_url: Optional[str] = None):
        self._base_url = (base_url or settings.OLLAMA_URL).rstrip("/")

    async def chat(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> ChatResult:
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"temperature": temperature},
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{self._base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        message = data.get("message", {})
        return ChatResult(
            content=message.get("content", ""),
            model=data.get("model", model),
            prompt_tokens=data.get("prompt_eval_count"),
            completion_tokens=data.get("eval_count"),
            raw=data,
        )

    async def stream(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            "options": {"temperature": temperature},
        }
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", f"{self._base_url}/api/chat", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    content = data.get("message", {}).get("content")
                    if content:
                        yield content
                    if data.get("done"):
                        break

    async def embedding(self, texts: list[str], model: str) -> list[list[float]]:
        results: list[list[float]] = []
        async with httpx.AsyncClient(timeout=120.0) as client:
            for text in texts:
                response = await client.post(
                    f"{self._base_url}/api/embeddings", json={"model": model, "prompt": text}
                )
                response.raise_for_status()
                data = response.json()
                results.append(data.get("embedding", []))
        return results

    async def models(self) -> list[ModelInfo]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self._base_url}/api/tags")
            response.raise_for_status()
            data = response.json()
        return [ModelInfo(name=m["name"], provider=self.name) for m in data.get("models", [])]

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self._base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
