import { Cloud, Cpu, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProviderBadge({
  provider,
  model,
  available,
  className,
}: {
  provider?: string | null;
  model?: string | null;
  available?: boolean;
  className?: string;
}) {
  if (!provider) return null;
  const isOpenAi = provider.toLowerCase() === "openai";
  const Icon = isOpenAi ? Cloud : Cpu;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span className="capitalize">{provider}</span>
      {model && (
        <>
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {model}
          </span>
        </>
      )}
      {typeof available === "boolean" && (
        <CircleDot
          className={cn(
            "h-2.5 w-2.5",
            available ? "text-success-500" : "text-neutral-400"
          )}
          strokeWidth={0}
          fill="currentColor"
        />
      )}
    </span>
  );
}
