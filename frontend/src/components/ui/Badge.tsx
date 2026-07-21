import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  accent: "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  danger: "bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
