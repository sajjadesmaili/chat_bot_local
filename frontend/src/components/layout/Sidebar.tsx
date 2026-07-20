"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FolderKanban,
  LayoutDashboard,
  Plus,
  ScrollText,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProviders } from "@/hooks/useProviders";
import { useUiStore } from "@/stores/useUiStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { cn } from "@/lib/utils";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { useState } from "react";
import { CREATOR } from "@/lib/creator";

export function Sidebar() {
  const pathname = usePathname();
  const { data: projects } = useProjects();
  const { data: providers } = useProviders();
  const toggleCommandPalette = useUiStore((s) => s.toggleCommandPalette);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const { t } = useTranslation();

  const activeProvider = providers?.find((p) => p.available);

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/projects", label: t("nav.projects"), icon: FolderKanban },
    { href: "/logs", label: t("nav.logs"), icon: ScrollText },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col border-e border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-950/40">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white">
          <Bot className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t("app.name")}
        </span>
      </div>

      <div className="px-3">
        <button
          onClick={toggleCommandPalette}
          className="mb-3 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-400 transition duration-200 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            {t("common.search")}
          </span>
          <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition duration-200",
                active
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/70"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.9} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 flex items-center justify-between px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          {t("sidebar.projects")}
        </span>
        <button
          onClick={() => setNewProjectOpen(true)}
          className="flex h-5.5 w-5.5 items-center justify-center rounded-md text-neutral-400 transition duration-200 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={t("sidebar.newProject")}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-thin mt-1 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {projects?.slice(0, 8).map((project) => {
          const active = pathname.startsWith(`/projects/${project.id}`);
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={cn(
                "flex items-center gap-2.5 truncate rounded-xl px-3 py-1.5 text-sm transition duration-200",
                active
                  ? "bg-neutral-200/70 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200"
              )}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
              <span className="truncate">{project.name}</span>
            </Link>
          );
        })}
        {projects?.length === 0 && (
          <p className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500">
            {t("sidebar.noProjects")}
          </p>
        )}
      </div>

      <div className="border-t border-neutral-200/70 px-3 py-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/70",
              pathname === "/profile"
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-500 dark:text-neutral-400"
            )}
          >
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
              <User className="h-3.5 w-3.5" />
            </div>
            {t("nav.profile")}
          </Link>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                activeProvider ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-600"
              )}
              title={
                activeProvider
                  ? t("sidebar.providerOnline", { provider: activeProvider.label })
                  : t("sidebar.noProvider")
              }
            />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <a
          href={CREATOR.websites[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate px-2 text-[11px] text-neutral-400 transition duration-200 hover:text-accent-600 dark:hover:text-accent-400"
          title={CREATOR.websites.map((s) => s.label).join(" | ")}
        >
          {t("sidebar.credit")} · sajjadesmaili.ir
        </a>
      </div>

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      />
    </aside>
  );
}
