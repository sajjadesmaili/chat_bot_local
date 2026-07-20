"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, FolderOpen, MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Dropdown } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useDeleteProject, useUpdateProject } from "@/hooks/useProjects";
import { useTranslation } from "@/hooks/useTranslation";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const { t } = useTranslation();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject(project.id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProject.mutate(
      { name: name.trim(), description: description.trim() },
      { onSuccess: () => setEditOpen(false) }
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="group relative flex h-full flex-col p-5 transition duration-200 hover:shadow-soft-lg">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400">
                <FolderOpen className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </Link>
            <Dropdown
              trigger={
                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition duration-150 hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              items={[
                { label: t("projectCard.rename"), icon: Pencil, onSelect: () => setEditOpen(true) },
                {
                  label: t("projectCard.delete"),
                  icon: Trash2,
                  danger: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
            />
          </div>

          <Link href={`/projects/${project.id}`} className="mt-3 flex-1">
            <h3 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
              {project.name}
            </h3>
            <p className="mt-1 min-h-[36px] text-sm text-neutral-500 dark:text-neutral-400">
              {project.description
                ? truncate(project.description, 90)
                : t("projects.noDescription")}
            </p>
          </Link>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {project.chat_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {project.document_count ?? 0}
              </span>
            </div>
            <span>{formatRelativeTime(project.updated_at, t)}</span>
          </div>
        </Card>
      </motion.div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t("projectCard.renameTitle")}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projectCard.description")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={updateProject.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t("projectCard.deleteTitle")}
        description={t("projectCard.deleteConfirm", { name: project.name })}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={deleteProject.isPending}
            onClick={() =>
              deleteProject.mutate(project.id, {
                onSuccess: () => {
                  setDeleteOpen(false);
                  router.refresh();
                },
              })
            }
          >
            {t("common.delete")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
