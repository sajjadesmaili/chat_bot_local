"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCreateProject } from "@/hooks/useProjects";
import { useTranslation } from "@/hooks/useTranslation";

export function NewProjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("projectModal.nameRequired"));
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      handleClose();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("projectModal.createFailed"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("projectModal.title")}
      description={t("projectModal.subtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("projectModal.name")}
          </label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("projectModal.namePlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("projectModal.description")}
          </label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projectModal.descriptionPlaceholder")}
          />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={createProject.isPending}>
            {t("projectModal.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
