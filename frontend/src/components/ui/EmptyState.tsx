import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
        <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {title}
        </p>
        {description && (
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
