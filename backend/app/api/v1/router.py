from fastapi import APIRouter

from app.api.v1.routes import chats, documents, health, logs, messages, projects, providers, settings, stats

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(chats.router)
api_router.include_router(messages.router)
api_router.include_router(documents.router)
api_router.include_router(settings.router)
api_router.include_router(providers.router)
api_router.include_router(logs.router)
api_router.include_router(stats.router)
