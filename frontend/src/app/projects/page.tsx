"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t("projects.title")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t("projects.subtitle")}
            </p>
          </div>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("projects.new")}
          </Button>
        </div>

        <div className="mt-6 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("projects.search")}
              className="ps-10"
            />
          </div>
        </div>

        <div className="mt-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          )}

          {!isLoading && sorted.length === 0 && (
            <EmptyState
              icon={FolderKanban}
              title={search ? t("projects.noMatchTitle") : t("projects.emptyTitle")}
              description={
                search ? t("projects.noMatchDesc") : t("projects.emptyDesc")
              }
              action={
                !search && (
                  <Button onClick={() => setNewProjectOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t("projects.new")}
                  </Button>
                )
              }
            />
          )}

          {sorted.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      <NewProjectModal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </div>
  );
}
