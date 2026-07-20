"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cloud,
  Cpu,
  FileText,
  FolderKanban,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useProjects } from "@/hooks/useProjects";
import { useProviders, useHealth } from "@/hooks/useProviders";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const { data: health } = useHealth();
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const recentProjects = [...(projects ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t("dashboard.title")}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  health?.status === "ok" ? "bg-success-500" : "bg-neutral-300"
                )}
              />
              {health?.status === "ok"
                ? t("dashboard.backendConnected")
                : t("dashboard.waitingBackend")}
            </p>
          </div>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("dashboard.newProject")}
          </Button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={FolderKanban}
            label={t("dashboard.projects")}
            value={stats?.total_projects ?? 0}
            isLoading={statsLoading}
            tone="accent"
          />
          <StatsCard
            icon={MessageSquare}
            label={t("dashboard.chats")}
            value={stats?.total_chats ?? 0}
            isLoading={statsLoading}
          />
          <StatsCard
            icon={Sparkles}
            label={t("dashboard.messages")}
            value={stats?.total_messages ?? 0}
            isLoading={statsLoading}
            tone="success"
          />
          <StatsCard
            icon={FileText}
            label={t("dashboard.documents")}
            value={stats?.total_documents ?? 0}
            isLoading={statsLoading}
          />
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t("dashboard.providers")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {providersLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            {!providersLoading && providers?.length === 0 && (
              <Card className="p-5 text-sm text-neutral-500 sm:col-span-2">
                {t("dashboard.noProviders")}
              </Card>
            )}
            {providers?.map((provider) => {
              const Icon = provider.name.toLowerCase() === "openai" ? Cloud : Cpu;
              return (
                <Card key={provider.id} className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      provider.available
                        ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {provider.label}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {provider.available
                        ? provider.default_model ||
                          t("dashboard.modelsCount", { count: provider.models.length })
                        : t("common.unavailable")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      provider.available ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-600"
                    )}
                  />
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t("dashboard.recentProjects")}
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
            >
              {t("common.viewAll")}
            </Link>
          </div>

          {projectsLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
          )}

          {!projectsLoading && recentProjects.length === 0 && (
            <EmptyState
              icon={FolderKanban}
              title={t("dashboard.noProjectsTitle")}
              description={t("dashboard.noProjectsDesc")}
              action={
                <Button onClick={() => setNewProjectOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {t("dashboard.newProject")}
                </Button>
              }
            />
          )}

          {recentProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
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
