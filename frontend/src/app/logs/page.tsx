"use client";

import { useState } from "react";
import { LogsTable } from "@/components/logs/LogsTable";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n";

const LEVELS: { value: string | undefined; key: TranslationKey }[] = [
  { value: undefined, key: "logs.all" },
  { value: "info", key: "logs.info" },
  { value: "warning", key: "logs.warning" },
  { value: "error", key: "logs.error" },
  { value: "debug", key: "logs.debug" },
];

export default function LogsPage() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<string | undefined>(undefined);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t("logs.title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t("logs.subtitle")}
        </p>

        <div className="mt-5 flex gap-1.5">
          {LEVELS.map((item) => (
            <button
              key={item.key}
              onClick={() => setLevel(item.value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition duration-200",
                level === item.value
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              )}
            >
              {t(item.key)}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <LogsTable level={level} />
        </div>
      </div>
    </div>
  );
}
