from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.application.services.provider_service import ProviderService
from app.application.services.settings_service import SettingsService
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RateLimitMiddleware
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.database.session import AsyncSessionLocal, init_models
from app.infrastructure.repositories.provider_repository import ProviderRepository
from app.infrastructure.repositories.settings_repository import SettingsRepository
from app.infrastructure.repositories.user_repository import UserRepository

configure_logging()
logger = get_logger(__name__)


async def _ensure_default_user() -> None:
    """Auth is optional/simple: a single local user (id=1) backs every request
    unless API_KEY_ENABLED=true. Created once on the very first startup."""
    async with AsyncSessionLocal() as session:
        repo = UserRepository(session)
        user = await repo.get_by_id(settings.DEFAULT_USER_ID)
        if user is None:
            await repo.create(username="local", email="local@localhost", is_active=True)
            await session.commit()
            logger.info("Created default local user (id=%s)", settings.DEFAULT_USER_ID)


async def _ensure_bootstrap_data() -> None:
    async with AsyncSessionLocal() as session:
        settings_service = SettingsService(SettingsRepository(session))
        await settings_service.ensure_defaults()

        provider_service = ProviderService(ProviderRepository(session), AIProviderFactory())
        await provider_service.ensure_catalog()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up %s (%s)", settings.APP_NAME, settings.APP_ENV)
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    await init_models()
    await _ensure_default_user()
    await _ensure_bootstrap_data()
    logger.info("Startup complete")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(api_router)


@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}
