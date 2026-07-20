from typing import Annotated

from fastapi import APIRouter, Depends

from app.application.schemas.settings import SettingsRead, SettingsUpdate
from app.application.services.settings_service import SettingsService
from app.core.deps import get_settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsRead)
async def get_settings_endpoint(service: Annotated[SettingsService, Depends(get_settings_service)]):
    return await service.get_settings()


@router.patch("", response_model=SettingsRead)
async def update_settings_endpoint(
    payload: SettingsUpdate, service: Annotated[SettingsService, Depends(get_settings_service)]
):
    return await service.update_settings(payload.model_dump(exclude_unset=True))
