import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition duration-200",
        "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-400",
        "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
