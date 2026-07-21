from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse

from app.application.schemas.common import PaginatedResponse
from app.application.schemas.message import MessageCreate, MessageRead
from app.application.services.message_service import MessageService
from app.core.deps import get_message_service

router = APIRouter(tags=["messages"])


def _paginate(items, total: int, page: int, page_size: int) -> PaginatedResponse:
    pages = (total + page_size - 1) // page_size if page_size else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, pages=pages or 1)


@router.get("/chats/{chat_id}/messages", response_model=PaginatedResponse[MessageRead])
async def list_messages(
    chat_id: int,
    service: Annotated[MessageService, Depends(get_message_service)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    items, total = await service.list_messages(chat_id, page, page_size)
    return _paginate(items, total, page, page_size)


@router.post("/chats/{chat_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: int, payload: MessageCreate, service: Annotated[MessageService, Depends(get_message_service)]
):
    return await service.send_message(chat_id, payload.content, payload.model)


@router.post("/chats/{chat_id}/messages/stream")
async def stream_message(
    chat_id: int, payload: MessageCreate, service: Annotated[MessageService, Depends(get_message_service)]
):
    generator = service.stream_message(chat_id, payload.content, payload.model)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
