import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function StatsCard({
  icon: Icon,
  label,
  value,
  isLoading,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  isLoading?: boolean;
  tone?: "neutral" | "accent" | "success";
}) {
  const toneClasses = {
    neutral: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    accent: "bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400",
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  } as const;

  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
          toneClasses[tone]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="mt-1.5 h-6 w-16" />
        ) : (
          <p className="mt-0.5 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
        )}
      </div>
    </Card>
  );
}
