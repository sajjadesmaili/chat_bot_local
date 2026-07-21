"use client";

import { Cpu, Cloud, ExternalLink, FolderKanban, Globe, MessageSquare, Server, Sparkles } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useHealth, useProviders } from "@/hooks/useProviders";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { getInitials } from "@/lib/utils";
import { CREATOR } from "@/lib/creator";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: health } = useHealth();
  const { data: providers } = useProviders();

  const userName = t("profile.localUser");

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t("profile.subtitle")}
        </p>

        <Card className="mt-7 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-600 text-xl font-semibold text-white">
              {getInitials(userName)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {userName}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t("profile.localDesc")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={health?.status === "ok" ? "success" : "neutral"}>
                  <Server className="h-3 w-3" />
                  {health?.status === "ok"
                    ? t("profile.backendOnline")
                    : t("profile.backendOffline")}
                </Badge>
                {health?.version && <Badge tone="neutral">v{health.version}</Badge>}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: FolderKanban, label: t("profile.projects"), value: stats?.total_projects },
            { icon: MessageSquare, label: t("profile.chats"), value: stats?.total_chats },
            { icon: Sparkles, label: t("profile.messages"), value: stats?.total_messages },
            { icon: FolderKanban, label: t("profile.documents"), value: stats?.total_documents },
          ].map((item) => (
            <Card key={item.label} className="p-4 text-center">
              <item.icon className="mx-auto h-4.5 w-4.5 text-neutral-400" />
              {statsLoading ? (
                <Skeleton className="mx-auto mt-2 h-5 w-8" />
              ) : (
                <p className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.value ?? 0}
                </p>
              )}
              <p className="text-xs text-neutral-400">{item.label}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-5">
          <CardContent className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {t("profile.activeProviders")}
            </h3>
            {providers?.length ? (
              providers.map((provider) => {
                const Icon = provider.name.toLowerCase() === "openai" ? Cloud : Cpu;
                return (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 px-3.5 py-2.5 dark:border-neutral-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {provider.label}
                      </span>
                    </div>
                    <Badge tone={provider.available ? "success" : "neutral"}>
                      {provider.available ? t("common.available") : t("common.offline")}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-neutral-400">{t("profile.noProviders")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t("profile.creator")}
              </h3>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {t("profile.creatorName")}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {t("profile.websites")}
              </p>
              <div className="flex flex-col gap-2">
                {CREATOR.websites.map((site) => (
                  <a
                    key={site.url}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-100 px-3.5 py-2.5 text-sm text-accent-600 transition duration-200 hover:border-accent-200 hover:bg-accent-50/50 dark:border-neutral-800 dark:text-accent-400 dark:hover:border-accent-500/30 dark:hover:bg-accent-500/10"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    {site.label}
                    <ExternalLink className="ms-auto h-3.5 w-3.5 opacity-60" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 px-3.5 py-3 dark:bg-neutral-900/60">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {t("profile.support")}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {t("profile.supportDesc")}
              </p>
              <a
                href={CREATOR.supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
              >
                sajjadesmaili.ir/support
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
