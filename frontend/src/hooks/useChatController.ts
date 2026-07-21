"use client";

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMessages } from "./useMessages";
import { useChatStore } from "@/stores/useChatStore";
import { streamChatMessage } from "@/lib/streaming";
import { queryKeys } from "@/lib/queryKeys";
import { generateTempId } from "@/lib/utils";
import type { Message } from "@/lib/types";

export function useChatController(chatId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const messagesQuery = useMessages(chatId);

  const streamingEntry = useChatStore((state) => state.streaming[chatId]);
  const startStreaming = useChatStore((state) => state.startStreaming);
  const appendToken = useChatStore((state) => state.appendToken);
  const setStreamingMeta = useChatStore((state) => state.setStreamingMeta);
  const finishStreaming = useChatStore((state) => state.finishStreaming);
  const failStreaming = useChatStore((state) => state.failStreaming);
  const stopStreamingAction = useChatStore((state) => state.stopStreaming);
  const clearStreaming = useChatStore((state) => state.clearStreaming);

  const isStreaming = streamingEntry?.isStreaming ?? false;

  const baseMessages = messagesQuery.data ?? [];

  const messages: Message[] = useMemo(() => {
    if (!streamingEntry) return baseMessages;
    const streamingMessage: Message = {
      id: streamingEntry.messageId,
      chat_id: chatId,
      role: "assistant",
      content: streamingEntry.content,
      provider: streamingEntry.provider ?? null,
      model: streamingEntry.model ?? null,
      created_at: new Date().toISOString(),
    };
    return [...baseMessages, streamingMessage];
  }, [baseMessages, streamingEntry, chatId]);

  const runStream = useCallback(
    (content: string, regenerate: boolean) => {
      const assistantTempId = generateTempId("assistant");
      const controller = startStreaming(chatId, assistantTempId);

      streamChatMessage({
        chatId,
        content,
        regenerate,
        signal: controller.signal,
        onChunk: (chunk) => {
          if (chunk.error) {
            failStreaming(chatId, chunk.error);
            return;
          }
          if (chunk.delta) appendToken(chatId, chunk.delta);
          if (chunk.provider || chunk.model) {
            setStreamingMeta(chatId, {
              provider: chunk.provider,
              model: chunk.model,
            });
          }
        },
        onError: (error) => {
          failStreaming(chatId, error.message || "Something went wrong.");
        },
        onDone: () => {
          finishStreaming(chatId);
          queryClient
            .invalidateQueries({ queryKey: queryKeys.messages(chatId) })
            .finally(() => {
              clearStreaming(chatId);
            });
          queryClient.invalidateQueries({ queryKey: queryKeys.chat(chatId) });
          if (projectId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.chats(projectId),
            });
          }
        },
      });
    },
    [
      chatId,
      startStreaming,
      appendToken,
      setStreamingMeta,
      finishStreaming,
      failStreaming,
      clearStreaming,
      queryClient,
      projectId,
    ]
  );

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      const optimisticUserMessage: Message = {
        id: generateTempId("user"),
        chat_id: chatId,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        queryKeys.messages(chatId),
        (prev) => [...(prev ?? []), optimisticUserMessage]
      );

      runStream(trimmed, false);
    },
    [chatId, isStreaming, queryClient, runStream]
  );

  const regenerate = useCallback(() => {
    if (isStreaming) return;
    const lastAssistantIndex = baseMessages.map((m) => m.role).lastIndexOf(
      "assistant"
    );
    if (lastAssistantIndex !== -1) {
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(chatId),
        (prev) => (prev ?? []).slice(0, lastAssistantIndex)
      );
    }
    runStream("", true);
  }, [baseMessages, chatId, isStreaming, queryClient, runStream]);

  const stop = useCallback(() => {
    stopStreamingAction(chatId);
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
  }, [chatId, stopStreamingAction, queryClient]);

  return {
    messages,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    isStreaming,
    streamingError: streamingEntry?.error ?? null,
    sendMessage,
    regenerate,
    stop,
    canRegenerate:
      !isStreaming && baseMessages.some((m) => m.role === "assistant"),
  };
}
