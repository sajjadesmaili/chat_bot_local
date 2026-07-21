from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.application.schemas.common import PaginatedResponse
from app.application.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.application.services.project_service import ProjectService
from app.core.deps import CurrentUser, get_project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _paginate(items, total: int, page: int, page_size: int) -> PaginatedResponse:
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, pages=pages or 1)


@router.get("", response_model=PaginatedResponse[ProjectRead])
async def list_projects(
    current_user: CurrentUser,
    service: Annotated[ProjectService, Depends(get_project_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    items, total = await service.list_projects(page, page_size, search, owner_id=current_user.id)
    return _paginate(items, total, page, page_size)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: CurrentUser,
    service: Annotated[ProjectService, Depends(get_project_service)],
):
    return await service.create_project(owner_id=current_user.id, **payload.model_dump())


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: int, service: Annotated[ProjectService, Depends(get_project_service)]):
    return await service.get_project(project_id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int, payload: ProjectUpdate, service: Annotated[ProjectService, Depends(get_project_service)]
):
    return await service.update_project(project_id, **payload.model_dump(exclude_unset=True))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, service: Annotated[ProjectService, Depends(get_project_service)]):
    await service.delete_project(project_id)
