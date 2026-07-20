"use client";

import { AlertCircle } from "lucide-react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ProviderBadge } from "@/components/ui/ProviderBadge";
import { useChatController } from "@/hooks/useChatController";
import { useChat } from "@/hooks/useChats";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/ui/Skeleton";

export function ChatWindow({
  chatId,
  projectId,
}: {
  chatId: string;
  projectId: string;
}) {
  const { t } = useTranslation();
  const { data: chat, isLoading: isChatLoading } = useChat(chatId);
  const {
    messages,
    isLoading,
    isStreaming,
    streamingError,
    sendMessage,
    regenerate,
    stop,
    canRegenerate,
  } = useChatController(chatId, projectId);

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/70 px-5 dark:border-neutral-800">
        {isChatLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <h1 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {chat?.title || t("chat.newChat")}
          </h1>
        )}
        {chat?.provider && (
          <ProviderBadge provider={chat.provider} model={chat.model} />
        )}
      </div>

      <MessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        canRegenerate={canRegenerate}
        onRegenerate={regenerate}
      />

      {streamingError && (
        <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700 dark:bg-danger-500/10 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {streamingError}
        </div>
      )}

      <ChatInput onSend={sendMessage} onStop={stop} isStreaming={isStreaming} />
    </div>
  );
}
