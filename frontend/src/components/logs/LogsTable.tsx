"use client";

import { AlertTriangle, Info, ScrollText, XCircle, Bug } from "lucide-react";
import { useLogs } from "@/hooks/useLogs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDateTime, cn } from "@/lib/utils";
import type { LogLevel } from "@/lib/types";
import type { TranslationKey } from "@/i18n";

const levelConfig: Record<
  LogLevel,
  { icon: typeof Info; tone: "neutral" | "accent" | "danger" | "warning"; key: TranslationKey }
> = {
  debug: { icon: Bug, tone: "neutral", key: "logs.debug" },
  info: { icon: Info, tone: "accent", key: "logs.info" },
  warning: { icon: AlertTriangle, tone: "warning", key: "logs.warning" },
  error: { icon: XCircle, tone: "danger", key: "logs.error" },
  critical: { icon: XCircle, tone: "danger", key: "logs.critical" },
};

export function LogsTable({ level }: { level?: string }) {
  const { t, locale } = useTranslation();
  const { data: logs, isLoading, isError } = useLogs({ level, limit: 200 });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={XCircle}
        title={t("logs.loadFailed")}
        description={t("logs.loadFailedDesc")}
      />
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title={t("logs.emptyTitle")}
        description={t("logs.emptyDesc")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200/70 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60">
            <th className="px-4 py-2.5">{t("logs.level")}</th>
            <th className="px-4 py-2.5">{t("logs.message")}</th>
            <th className="px-4 py-2.5">{t("logs.source")}</th>
            <th className="px-4 py-2.5">{t("logs.time")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const config = levelConfig[log.level] ?? levelConfig.info;
            return (
              <tr
                key={log.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/70 dark:border-neutral-800/70 dark:hover:bg-neutral-900/40"
              >
                <td className="px-4 py-2.5">
                  <Badge tone={config.tone} className="uppercase">
                    <config.icon className="h-3 w-3" />
                    {t(config.key)}
                  </Badge>
                </td>
                <td
                  className={cn(
                    "max-w-[420px] truncate px-4 py-2.5 text-neutral-700 dark:text-neutral-300"
                  )}
                  title={log.message}
                >
                  {log.message}
                </td>
                <td className="px-4 py-2.5 text-neutral-400">
                  {log.source ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-neutral-400">
                  {formatDateTime(log.created_at, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
