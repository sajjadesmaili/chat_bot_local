"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, Copy, FileText, RotateCw, User } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypingIndicator } from "./TypingIndicator";
import { ProviderBadge } from "@/components/ui/ProviderBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDateTime, cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

export function MessageBubble({
  message,
  isStreaming,
  isLast,
  canRegenerate,
  onRegenerate,
}: {
  message: Message;
  isStreaming?: boolean;
  isLast?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const { t, locale } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
          <Bot className="h-4 w-4" strokeWidth={1.75} />
        </div>
      )}

      <div className={cn("min-w-0 max-w-[720px]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "min-w-0 rounded-2xl px-4 py-3",
            isUser
              ? "bg-accent-600 text-white"
              : "bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.content}
            </p>
          ) : message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : isStreaming ? (
            <TypingIndicator />
          ) : (
            <p className="text-sm text-neutral-400">{t("chat.noResponse")}</p>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, idx) => (
              <span
                key={`${source.document_id}-${idx}`}
                title={source.snippet}
                className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              >
                <FileText className="h-3 w-3" />
                {source.document_name}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "mt-1.5 flex items-center gap-2 px-1 text-xs text-neutral-400",
            isUser && "flex-row-reverse"
          )}
        >
          <span>{formatDateTime(message.created_at, locale)}</span>
          {!isUser && message.provider && (
            <ProviderBadge
              provider={message.provider}
              model={message.model}
              className="border-0 bg-transparent px-0 py-0 dark:bg-transparent"
            />
          )}
          {!isUser && message.content && !isStreaming && (
            <button
              onClick={handleCopy}
              title={copied ? t("chat.copied") : t("chat.copy")}
              aria-label={copied ? t("chat.copied") : t("chat.copy")}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition duration-200 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
          {!isUser && isLast && canRegenerate && !isStreaming && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition duration-200 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <RotateCw className="h-3 w-3" /> {t("chat.regenerate")}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          <User className="h-4 w-4" strokeWidth={1.75} />
        </div>
      )}
    </motion.div>
  );
}
