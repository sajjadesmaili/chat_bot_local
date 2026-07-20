"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.toggle")}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition duration-200 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        className
      )}
      title={isDark ? t("theme.toLight") : t("theme.toDark")}
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4.5 w-4.5" strokeWidth={1.75} />
      )}
    </button>
  );
}
