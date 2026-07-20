from typing import Annotated

from fastapi import APIRouter, Depends

from app.application.schemas.provider import ProviderDetectResult, ProviderRead
from app.application.services.provider_service import ProviderService
from app.core.deps import get_provider_service

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=list[ProviderRead])
async def list_providers(service: Annotated[ProviderService, Depends(get_provider_service)]):
    return await service.list_providers()


@router.get("/detect", response_model=list[ProviderDetectResult])
async def detect_providers(service: Annotated[ProviderService, Depends(get_provider_service)]):
    return await service.detect_providers()
