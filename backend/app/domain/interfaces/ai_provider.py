from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class ChatResult:
    content: str
    model: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelInfo:
    name: str
    provider: str
    supports_chat: bool = True
    supports_embedding: bool = False


class AIProvider(ABC):
    """Common interface every AI provider (OpenAI, Ollama, ...) must implement.

    Implementations are constructed on demand so the active provider can be
    switched at runtime (via Settings) without restarting the application.
    """

    name: str

    @abstractmethod
    async def chat(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> ChatResult:
        ...

    @abstractmethod
    async def stream(
        self, messages: list[ChatMessage], model: str, temperature: float = 0.7, **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        ...

    @abstractmethod
    async def embedding(self, texts: list[str], model: str) -> list[list[float]]:
        ...

    @abstractmethod
    async def models(self) -> list[ModelInfo]:
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        ...
