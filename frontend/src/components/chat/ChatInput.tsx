"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder,
}: {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleSubmit() {
    if (!value.trim() || isStreaming || disabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <div className="border-t border-neutral-200/70 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 shadow-soft transition duration-200 focus-within:border-accent-400 dark:border-neutral-800 dark:bg-neutral-900">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder ?? t("chat.placeholder")}
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60 dark:text-neutral-100"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition duration-200 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              aria-label={t("chat.stop")}
              title={t("chat.stop")}
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition duration-200",
                value.trim() && !disabled
                  ? "bg-accent-600 text-white hover:bg-accent-700"
                  : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600"
              )}
              aria-label={t("chat.send")}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-neutral-400">
          {t("chat.hint")}
        </p>
      </div>
    </div>
  );
}
