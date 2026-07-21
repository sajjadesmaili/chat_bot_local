import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TimeTranslator = (
  key:
    | "time.justNow"
    | "time.secondsAgo"
    | "time.minutesAgo"
    | "time.hoursAgo"
    | "time.daysAgo"
    | "time.weeksAgo"
    | "time.monthsAgo"
    | "time.yearsAgo",
  params?: Record<string, string | number>
) => string;

export function formatRelativeTime(
  dateInput: string | number | Date,
  t?: TimeTranslator
): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const tr: TimeTranslator =
    t ??
    ((key, params) => {
      const fallback: Record<string, string> = {
        "time.justNow": "just now",
        "time.secondsAgo": "{count}s ago",
        "time.minutesAgo": "{count}m ago",
        "time.hoursAgo": "{count}h ago",
        "time.daysAgo": "{count}d ago",
        "time.weeksAgo": "{count}w ago",
        "time.monthsAgo": "{count}mo ago",
        "time.yearsAgo": "{count}y ago",
      };
      let text = fallback[key] ?? key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    });

  if (diffSec < 5) return tr("time.justNow");
  if (diffSec < 60) return tr("time.secondsAgo", { count: diffSec });
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return tr("time.minutesAgo", { count: diffMin });
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return tr("time.hoursAgo", { count: diffHour });
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return tr("time.daysAgo", { count: diffDay });
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 4) return tr("time.weeksAgo", { count: diffWeek });
  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return tr("time.monthsAgo", { count: diffMonth });
  const diffYear = Math.round(diffDay / 365);
  return tr("time.yearsAgo", { count: diffYear });
}

export function formatDateTime(
  dateInput: string | number | Date,
  locale: string = "en"
): string {
  const date = new Date(dateInput);
  return date.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function generateTempId(prefix = "tmp"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
