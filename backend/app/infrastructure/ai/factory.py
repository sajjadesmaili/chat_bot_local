from app.domain.interfaces.ai_provider import AIProvider
from app.infrastructure.ai.ollama_provider import OllamaProvider
from app.infrastructure.ai.openai_provider import OpenAIProvider


class AIProviderFactory:
    """Builds AIProvider instances by name.

    Providers are instantiated fresh on every call (they are cheap, stateless
    wrappers around an HTTP client) which is what makes the active provider
    switchable at runtime via Settings without restarting the app.
    """

    _providers: dict[str, type[AIProvider]] = {
        "openai": OpenAIProvider,
        "ollama": OllamaProvider,
    }

    def get(self, name: str) -> AIProvider:
        key = (name or "").lower().strip()
        provider_cls = self._providers.get(key)
        if provider_cls is None:
            raise ValueError(f"Unknown AI provider: '{name}'. Available: {self.available_names()}")
        return provider_cls()

    def available_names(self) -> list[str]:
        return list(self._providers.keys())
