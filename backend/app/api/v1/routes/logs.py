from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.application.schemas.common import PaginatedResponse
from app.application.schemas.log import LogRead
from app.application.services.log_service import LogService
from app.core.deps import get_log_service

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=PaginatedResponse[LogRead])
async def list_logs(
    service: Annotated[LogService, Depends(get_log_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    level: Optional[str] = None,
    category: Optional[str] = None,
    project_id: Optional[int] = None,
):
    items, total = await service.list_logs(page, page_size, level=level, category=category, project_id=project_id)
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, pages=pages or 1)
