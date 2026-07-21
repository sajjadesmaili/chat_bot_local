from typing import Annotated, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status

from app.application.schemas.common import PaginatedResponse
from app.application.schemas.document import DocumentRead
from app.application.services.document_service import DocumentService
from app.core.deps import get_document_service

router = APIRouter(tags=["documents"])


def _paginate(items, total: int, page: int, page_size: int) -> PaginatedResponse:
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, pages=pages or 1)


@router.get("/projects/{project_id}/documents", response_model=PaginatedResponse[DocumentRead])
async def list_documents(
    project_id: int,
    service: Annotated[DocumentService, Depends(get_document_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    items, total = await service.list_documents(project_id, page, page_size, search)
    return _paginate(items, total, page, page_size)


@router.post("/projects/{project_id}/documents", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    project_id: int,
    background_tasks: BackgroundTasks,
    service: Annotated[DocumentService, Depends(get_document_service)],
    file: UploadFile = File(...),
):
    document = await service.upload_document(project_id, file)
    background_tasks.add_task(DocumentService.process_document, document.id)
    return document


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    project_id: Annotated[int, Query(...)],
    service: Annotated[DocumentService, Depends(get_document_service)],
):
    await service.delete_document(project_id, document_id)
