"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useTranslation();
  const nextLabel = locale === "fa" ? t("lang.toEnglish") : t("lang.toPersian");

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={nextLabel}
      aria-label={t("lang.toggle")}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-neutral-500 transition duration-200 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        className
      )}
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{locale === "fa" ? "EN" : "فا"}</span>
    </button>
  );
}
