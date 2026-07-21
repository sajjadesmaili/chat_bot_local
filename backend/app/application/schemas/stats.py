from pydantic import BaseModel


class StatsOverview(BaseModel):
    total_projects: int
    total_chats: int
    total_documents: int
    total_messages: int
    total_tokens_prompt: int
    total_tokens_completion: int
    provider_usage: dict[str, int]
    logs_by_level: dict[str, int]
