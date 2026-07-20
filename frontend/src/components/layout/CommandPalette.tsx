"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  Languages,
  LayoutDashboard,
  MessageSquarePlus,
  Moon,
  ScrollText,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useUiStore } from "@/stores/useUiStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);
  const router = useRouter();
  const { t, toggleLocale } = useTranslation();
  const { data: projects } = useProjects();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const staticActions: PaletteAction[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: t("command.dashboard"),
        icon: LayoutDashboard,
        onSelect: () => router.push("/"),
      },
      {
        id: "projects",
        label: t("command.projects"),
        icon: FolderKanban,
        onSelect: () => router.push("/projects"),
      },
      {
        id: "settings",
        label: t("command.settings"),
        icon: Settings,
        onSelect: () => router.push("/settings"),
      },
      {
        id: "logs",
        label: t("command.logs"),
        icon: ScrollText,
        onSelect: () => router.push("/logs"),
      },
      {
        id: "profile",
        label: t("command.profile"),
        icon: User,
        onSelect: () => router.push("/profile"),
      },
      {
        id: "theme",
        label: t("command.toggleTheme"),
        icon: theme === "dark" ? Sun : Moon,
        onSelect: () => toggleTheme(),
      },
      {
        id: "language",
        label: t("command.toggleLanguage"),
        icon: Languages,
        onSelect: () => toggleLocale(),
      },
    ],
    [router, toggleTheme, theme, toggleLocale, t]
  );

  const projectActions: PaletteAction[] = useMemo(
    () =>
      (projects ?? []).map((project) => ({
        id: `project-${project.id}`,
        label: project.name,
        hint: t("command.project"),
        icon: MessageSquarePlus,
        onSelect: () => router.push(`/projects/${project.id}`),
      })),
    [projects, router, t]
  );

  const allActions = [...staticActions, ...projectActions];
  const filtered = query
    ? allActions.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  const close = () => setOpen(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[activeIndex];
      if (action) {
        action.onSelect();
        close();
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-soft-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("command.placeholder")}
                className="h-12 w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
              />
              <kbd className="rounded-md border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-400 dark:border-neutral-700">
                Esc
              </kbd>
            </div>
            <div className="scrollbar-thin max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-neutral-400">
                  {t("command.noResults")}
                </p>
              )}
              {filtered.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onSelect();
                    close();
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-150",
                    index === activeIndex
                      ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300"
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{action.label}</span>
                  {action.hint && (
                    <span className="text-xs text-neutral-400">
                      {action.hint}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
