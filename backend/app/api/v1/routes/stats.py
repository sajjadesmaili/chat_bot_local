from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.application.schemas.stats import StatsOverview
from app.application.services.stats_service import StatsService
from app.core.deps import get_stats_service

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOverview)
async def get_stats(
    service: Annotated[StatsService, Depends(get_stats_service)],
    project_id: Optional[int] = Query(None),
):
    return await service.get_overview(project_id=project_id)
