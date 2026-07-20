"use client";

import { useEffect, useRef } from "react";
import { MessageSquareText } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import type { Message } from "@/lib/types";

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  canRegenerate,
  onRegenerate,
}: {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-16 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title={t("chat.emptyTitle")}
        description={t("chat.emptyDesc")}
        className="flex-1"
      />
    );
  }

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf("assistant");

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"}
            isLast={index === lastAssistantIndex}
            canRegenerate={canRegenerate}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
