from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.application.schemas.chat import ChatCreate, ChatRead, ChatUpdate
from app.application.schemas.common import PaginatedResponse
from app.application.services.chat_service import ChatService
from app.core.deps import get_chat_service

router = APIRouter(tags=["chats"])


def _paginate(items, total: int, page: int, page_size: int) -> PaginatedResponse:
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, pages=pages or 1)


@router.get("/projects/{project_id}/chats", response_model=PaginatedResponse[ChatRead])
async def list_chats(
    project_id: int,
    service: Annotated[ChatService, Depends(get_chat_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    items, total = await service.list_chats(project_id, page, page_size, search)
    return _paginate(items, total, page, page_size)


@router.post("/projects/{project_id}/chats", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(
    project_id: int, payload: ChatCreate, service: Annotated[ChatService, Depends(get_chat_service)]
):
    return await service.create_chat(project_id, payload.title)


@router.get("/chats/{chat_id}", response_model=ChatRead)
async def get_chat(chat_id: int, service: Annotated[ChatService, Depends(get_chat_service)]):
    return await service.get_chat(chat_id)


@router.patch("/chats/{chat_id}", response_model=ChatRead)
async def update_chat(
    chat_id: int, payload: ChatUpdate, service: Annotated[ChatService, Depends(get_chat_service)]
):
    return await service.update_chat(chat_id, payload.title)


@router.delete("/chats/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: int, service: Annotated[ChatService, Depends(get_chat_service)]):
    await service.delete_chat(chat_id)
