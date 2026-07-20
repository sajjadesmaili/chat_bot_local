from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SoftDeleteMixin:
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class LogLevel(str, enum.Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class LogCategory(str, enum.Enum):
    CHAT = "chat"
    EMBEDDING = "embedding"
    DOCUMENT = "document"
    SYSTEM = "system"
    PROVIDER = "provider"
    AUTH = "auth"
    RATE_LIMIT = "rate_limit"


def _enum_values(enum_cls):
    """Store the lowercase `.value` (not `.name`) of str Enums in the DB,
    matching the Postgres enum labels created by the Alembic migration."""
    return [member.value for member in enum_cls]


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    api_key: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    projects: Mapped[list["Project"]] = relationship(back_populates="owner")


class Project(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    ai_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    chat_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    embedding_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    rag_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    owner: Mapped["User"] = relationship(back_populates="projects")
    chats: Mapped[list["Chat"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class Chat(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="New Chat", nullable=False)

    project: Mapped["Project"] = relationship(back_populates="chats")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(
        SAEnum(MessageRole, name="message_role", values_callable=_enum_values), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tokens_prompt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tokens_completion: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    context_used: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    chat: Mapped["Chat"] = relationship(back_populates="messages")


class Document(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        SAEnum(DocumentStatus, name="document_status", values_callable=_enum_values),
        default=DocumentStatus.PENDING,
        nullable=False,
    )
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship(back_populates="documents")
    embeddings: Mapped[list["Embedding"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class Embedding(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    vector_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(100), nullable=False)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    document: Mapped["Document"] = relationship(back_populates="embeddings")


class Log(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level: Mapped[LogLevel] = mapped_column(
        SAEnum(LogLevel, name="log_level", values_callable=_enum_values),
        default=LogLevel.INFO,
        nullable=False,
    )
    category: Mapped[LogCategory] = mapped_column(
        SAEnum(LogCategory, name="log_category", values_callable=_enum_values),
        default=LogCategory.SYSTEM,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    chat_id: Mapped[Optional[int]] = mapped_column(ForeignKey("chats.id"), nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)


class Setting(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class Provider(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "providers"
    __table_args__ = (UniqueConstraint("name", name="uq_providers_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Statistic(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "statistics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    metric_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    total_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_chats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_documents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens_prompt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens_completion: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    provider_usage: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
