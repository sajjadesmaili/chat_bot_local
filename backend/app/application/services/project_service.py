import json
import time
from pathlib import Path
from typing import Any, Optional

from app.application.services.log_service import LogService
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.domain.entities.models import LogCategory, LogLevel, Project
from app.infrastructure.repositories.project_repository import ProjectRepository

# #region agent log
_DEBUG_LOG = Path(__file__).resolve().parents[4] / "debug-3d5e50.log"


def _agent_log(hypothesis_id: str, location: str, message: str, data: dict | None = None) -> None:
    payload = {
        "sessionId": "3d5e50",
        "runId": "pre-fix",
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data or {},
        "timestamp": int(time.time() * 1000),
    }
    try:
        with _DEBUG_LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except OSError:
        pass


# #endregion


class ProjectService:
    def __init__(self, repo: ProjectRepository, log_service: LogService):
        self.repo = repo
        self.log_service = log_service

    async def list_projects(self, page: int, page_size: int, search: Optional[str], owner_id: int):
        return await self.repo.list(
            page=page,
            page_size=page_size,
            search=search,
            search_fields=["name", "description"],
            owner_id=owner_id,
        )

    async def get_project(self, project_id: int) -> Project:
        project = await self.repo.get_by_id(project_id)
        if project is None:
            raise NotFoundException(f"Project {project_id} not found")
        return project

    async def create_project(self, owner_id: int, **data: Any) -> Project:
        project = await self.repo.create(owner_id=owner_id, **data)
        await self.repo.session.commit()
        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message=f"Project '{project.name}' created",
            project_id=project.id,
        )
        return project

    async def update_project(self, project_id: int, **data: Any) -> Project:
        project = await self.repo.update(project_id, **data)
        if project is None:
            raise NotFoundException(f"Project {project_id} not found")
        await self.repo.session.commit()
        return project

    async def delete_project(self, project_id: int) -> None:
        # #region agent log
        upload_dir = settings.upload_path / str(project_id)
        files_before = []
        if upload_dir.exists():
            files_before = [p.name for p in upload_dir.iterdir() if p.is_file()]
        _agent_log(
            "A",
            "project_service.py:delete_project:before",
            "Project delete starting; checking upload dir",
            {
                "project_id": project_id,
                "upload_dir": str(upload_dir),
                "upload_dir_exists": upload_dir.exists(),
                "file_count": len(files_before),
                "files": files_before[:20],
            },
        )
        # #endregion

        ok = await self.repo.soft_delete(project_id)
        if not ok:
            raise NotFoundException(f"Project {project_id} not found")
        await self.repo.session.commit()

        # #region agent log
        files_after = []
        if upload_dir.exists():
            files_after = [p.name for p in upload_dir.iterdir() if p.is_file()]
        _agent_log(
            "A",
            "project_service.py:delete_project:after",
            "Project soft-deleted; upload files state after (no cleanup yet)",
            {
                "project_id": project_id,
                "upload_dir_exists": upload_dir.exists(),
                "file_count_after": len(files_after),
                "files_remain": files_after[:20],
                "cleanup_performed": False,
            },
        )
        # #endregion

        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message=f"Project {project_id} deleted",
            project_id=project_id,
        )
