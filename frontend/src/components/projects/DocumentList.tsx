"use client";

import { FileText, Loader2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useDeleteDocument, useDocuments } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { formatBytes, formatRelativeTime, cn } from "@/lib/utils";

export function DocumentList({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data: documents, isLoading } = useDocuments(projectId);
  const deleteDocument = useDeleteDocument(projectId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t("docs.emptyTitle")}
        description={t("docs.emptyDesc")}
        className="py-10"
      />
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-white px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {doc.filename}
            </p>
            <p className="text-xs text-neutral-400">
              {formatBytes(doc.size)} · {formatRelativeTime(doc.created_at, t)}
              {doc.chunk_count ? ` · ${doc.chunk_count} ${t("docs.chunks")}` : ""}
            </p>
          </div>
          <StatusPill status={doc.status} />
          <button
            onClick={() => deleteDocument.mutate(doc.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition duration-200 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
            aria-label={t("docs.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "ready") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
        <CheckCircle2 className="h-3 w-3" /> {t("docs.ready")}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-danger-50 px-2 py-1 text-xs font-medium text-danger-700 dark:bg-danger-500/15 dark:text-danger-400">
        <AlertCircle className="h-3 w-3" /> {t("docs.failed")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      <Loader2 className="h-3 w-3 animate-spin" /> {t("docs.processing")}
    </span>
  );
}
