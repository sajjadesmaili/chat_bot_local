"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/hooks/useDocuments";
import { useTranslation } from "@/hooks/useTranslation";

const ACCEPTED = ".pdf,.docx,.txt,.md,.csv,.json,.py,.js,.ts,.tsx,.jsx,.java,.c,.cpp,.go,.rs";

export function DocumentUpload({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const uploadDocument = useUploadDocument(projectId);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      try {
        await uploadDocument.mutateAsync(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("docs.uploadFailed"));
      }
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition duration-200",
          isDragging
            ? "border-accent-400 bg-accent-50/60 dark:bg-accent-500/10"
            : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          <UploadCloud className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {uploadDocument.isPending ? t("docs.uploading") : t("docs.drop")}
        </p>
        <p className="text-xs text-neutral-400">{t("docs.formats")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
    </div>
  );
}
