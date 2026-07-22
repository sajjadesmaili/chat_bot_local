import uuid
from pathlib import Path

from fastapi import UploadFile

from app.application.services.log_service import LogService
from app.application.services.rag_service import RagService
from app.application.services.settings_service import SettingsService
from app.core.config import settings
from app.core.exceptions import NotFoundException, ValidationException
from app.domain.entities.models import Document, DocumentStatus, LogCategory, LogLevel
from app.infrastructure.ai.factory import AIProviderFactory
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.repositories.document_repository import DocumentRepository
from app.infrastructure.repositories.embedding_repository import EmbeddingRepository
from app.infrastructure.repositories.log_repository import LogRepository
from app.infrastructure.repositories.project_repository import ProjectRepository
from app.infrastructure.repositories.settings_repository import SettingsRepository

ALLOWED_EXTENSIONS = set(settings.ALLOWED_UPLOAD_EXTENSIONS)
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


class DocumentService:
    def __init__(
        self,
        repo: DocumentRepository,
        project_repo: ProjectRepository,
        rag_service: RagService,
        log_service: LogService,
    ):
        self.repo = repo
        self.project_repo = project_repo
        self.rag_service = rag_service
        self.log_service = log_service

    async def _get_project_or_404(self, project_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if project is None:
            raise NotFoundException(f"Project {project_id} not found")
        return project

    async def list_documents(self, project_id: int, page: int, page_size: int, search: str | None):
        await self._get_project_or_404(project_id)
        return await self.repo.list(
            page=page, page_size=page_size, search=search, search_fields=["filename"], project_id=project_id
        )

    async def upload_document(self, project_id: int, file: UploadFile) -> Document:
        await self._get_project_or_404(project_id)

        filename = file.filename or "unnamed"
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationException(
                f"Unsupported file type '{ext or '(none)'}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}"
            )

        contents = await file.read()
        if len(contents) == 0:
            raise ValidationException("Uploaded file is empty")
        if len(contents) > MAX_SIZE_BYTES:
            raise ValidationException(f"File too large. Max size is {settings.MAX_UPLOAD_SIZE_MB}MB")

        project_dir = settings.upload_path / str(project_id)
        project_dir.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid.uuid4().hex}{ext}"
        file_path = project_dir / stored_name
        file_path.write_bytes(contents)

        document = await self.repo.create(
            project_id=project_id,
            filename=filename,
            file_path=str(file_path),
            file_type=ext.lstrip("."),
            file_size=len(contents),
            status=DocumentStatus.PENDING,
        )
        await self.repo.session.commit()
        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.DOCUMENT,
            message=f"Document '{filename}' uploaded",
            project_id=project_id,
            meta={"document_id": document.id, "size": len(contents)},
        )
        return document

    async def delete_document(self, project_id: int, document_id: int) -> None:
        document = await self.repo.get_by_id(document_id)
        if document is None or document.project_id != project_id:
            # #region agent log
            import json
            import time
            from pathlib import Path as _P

            _log = _P(__file__).resolve().parents[4] / "debug-3d5e50.log"
            try:
                with _log.open("a", encoding="utf-8") as f:
                    f.write(
                        json.dumps(
                            {
                                "sessionId": "3d5e50",
                                "runId": "pre-fix",
                                "hypothesisId": "B",
                                "location": "document_service.py:delete_document:not_found",
                                "message": "Document delete failed: not found or project mismatch",
                                "data": {
                                    "project_id": project_id,
                                    "document_id": document_id,
                                    "found": document is not None,
                                    "doc_project_id": getattr(document, "project_id", None),
                                },
                                "timestamp": int(time.time() * 1000),
                            },
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
            except OSError:
                pass
            # #endregion
            raise NotFoundException(f"Document {document_id} not found in project {project_id}")

        # #region agent log
        import json
        import time
        from pathlib import Path as _P

        _log = _P(__file__).resolve().parents[4] / "debug-3d5e50.log"
        file_path = Path(document.file_path)
        try:
            with _log.open("a", encoding="utf-8") as f:
                f.write(
                    json.dumps(
                        {
                            "sessionId": "3d5e50",
                            "runId": "pre-fix",
                            "hypothesisId": "C",
                            "location": "document_service.py:delete_document:before_unlink",
                            "message": "Document delete reached file unlink",
                            "data": {
                                "project_id": project_id,
                                "document_id": document_id,
                                "file_path": str(file_path),
                                "file_exists_before": file_path.exists(),
                            },
                            "timestamp": int(time.time() * 1000),
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        except OSError:
            pass
        # #endregion

        await self.rag_service.delete_document_vectors(project_id, document_id)
        await self.repo.soft_delete(document_id)
        await self.repo.session.commit()

        unlink_ok = False
        unlink_error = None
        try:
            Path(document.file_path).unlink(missing_ok=True)
            unlink_ok = True
        except OSError as exc:
            unlink_error = str(exc)

        # #region agent log
        try:
            with _log.open("a", encoding="utf-8") as f:
                f.write(
                    json.dumps(
                        {
                            "sessionId": "3d5e50",
                            "runId": "pre-fix",
                            "hypothesisId": "C",
                            "location": "document_service.py:delete_document:after_unlink",
                            "message": "Document file unlink result",
                            "data": {
                                "project_id": project_id,
                                "document_id": document_id,
                                "unlink_ok": unlink_ok,
                                "unlink_error": unlink_error,
                                "file_exists_after": file_path.exists(),
                            },
                            "timestamp": int(time.time() * 1000),
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        except OSError:
            pass
        # #endregion

        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.DOCUMENT,
            message=f"Document {document_id} deleted",
            project_id=project_id,
        )

    @staticmethod
    async def process_document(document_id: int) -> None:
        """Background ingestion task: opens its own DB session/transaction so
        it can safely run after the upload response has already been sent."""
        async with AsyncSessionLocal() as session:
            document_repo = DocumentRepository(session)
            embedding_repo = EmbeddingRepository(session)
            settings_service = SettingsService(SettingsRepository(session))
            log_service = LogService(LogRepository(session))
            rag_service = RagService(document_repo, embedding_repo, settings_service, AIProviderFactory())

            document = await document_repo.get_by_id(document_id)
            if document is None:
                return

            document.status = DocumentStatus.PROCESSING
            await session.commit()

            try:
                chunk_count = await rag_service.ingest_document(document)
                document.status = DocumentStatus.COMPLETED
                document.chunk_count = chunk_count
                document.error_message = None
                await session.commit()
                await log_service.log(
                    level=LogLevel.INFO,
                    category=LogCategory.EMBEDDING,
                    message=f"Document '{document.filename}' processed into {chunk_count} chunks",
                    project_id=document.project_id,
                    meta={"document_id": document.id},
                )
            except Exception as exc:  # noqa: BLE001
                document.status = DocumentStatus.FAILED
                document.error_message = str(exc)
                await session.commit()
                await log_service.log(
                    level=LogLevel.ERROR,
                    category=LogCategory.EMBEDDING,
                    message=f"Failed to process document '{document.filename}': {exc}",
                    project_id=document.project_id,
                    meta={"document_id": document.id},
                )
