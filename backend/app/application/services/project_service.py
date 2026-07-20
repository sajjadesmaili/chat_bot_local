from typing import Any, Optional

from app.application.services.log_service import LogService
from app.core.exceptions import NotFoundException
from app.domain.entities.models import LogCategory, LogLevel, Project
from app.infrastructure.repositories.project_repository import ProjectRepository


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
        ok = await self.repo.soft_delete(project_id)
        if not ok:
            raise NotFoundException(f"Project {project_id} not found")
        await self.repo.session.commit()
        await self.log_service.log(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message=f"Project {project_id} deleted",
            project_id=project_id,
        )
