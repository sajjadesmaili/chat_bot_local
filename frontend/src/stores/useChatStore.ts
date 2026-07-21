import { create } from "zustand";
import type { Message } from "@/lib/types";

interface StreamingEntry {
  messageId: string;
  content: string;
  provider?: string | null;
  model?: string | null;
  isStreaming: boolean;
  error?: string | null;
}

interface ChatState {
  /** draft input text keyed by chat id, preserved when switching chats */
  drafts: Record<string, string>;
  setDraft: (chatId: string, value: string) => void;

  /** in-flight streaming state keyed by chat id */
  streaming: Record<string, StreamingEntry | undefined>;
  abortControllers: Record<string, AbortController | undefined>;

  startStreaming: (chatId: string, messageId: string) => AbortController;
  appendToken: (chatId: string, token: string) => void;
  setStreamingMeta: (
    chatId: string,
    meta: { provider?: string | null; model?: string | null }
  ) => void;
  finishStreaming: (chatId: string) => void;
  failStreaming: (chatId: string, error: string) => void;
  stopStreaming: (chatId: string) => void;
  clearStreaming: (chatId: string) => void;
  getStreamingMessage: (chatId: string) => Message | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  drafts: {},
  setDraft: (chatId, value) =>
    set((state) => ({ drafts: { ...state.drafts, [chatId]: value } })),

  streaming: {},
  abortControllers: {},

  startStreaming: (chatId, messageId) => {
    const controller = new AbortController();
    set((state) => ({
      streaming: {
        ...state.streaming,
        [chatId]: {
          messageId,
          content: "",
          isStreaming: true,
          error: null,
        },
      },
      abortControllers: { ...state.abortControllers, [chatId]: controller },
    }));
    return controller;
  },

  appendToken: (chatId, token) =>
    set((state) => {
      const entry = state.streaming[chatId];
      if (!entry) return state;
      return {
        streaming: {
          ...state.streaming,
          [chatId]: { ...entry, content: entry.content + token },
        },
      };
    }),

  setStreamingMeta: (chatId, meta) =>
    set((state) => {
      const entry = state.streaming[chatId];
      if (!entry) return state;
      return {
        streaming: {
          ...state.streaming,
          [chatId]: { ...entry, ...meta },
        },
      };
    }),

  finishStreaming: (chatId) =>
    set((state) => {
      const entry = state.streaming[chatId];
      if (!entry) return state;
      return {
        streaming: {
          ...state.streaming,
          [chatId]: { ...entry, isStreaming: false },
        },
      };
    }),

  failStreaming: (chatId, error) =>
    set((state) => {
      const entry = state.streaming[chatId];
      if (!entry) return state;
      return {
        streaming: {
          ...state.streaming,
          [chatId]: { ...entry, isStreaming: false, error },
        },
      };
    }),

  stopStreaming: (chatId) => {
    const controller = get().abortControllers[chatId];
    controller?.abort();
    set((state) => {
      const entry = state.streaming[chatId];
      if (!entry) return state;
      return {
        streaming: {
          ...state.streaming,
          [chatId]: { ...entry, isStreaming: false },
        },
      };
    });
  },

  clearStreaming: (chatId) =>
    set((state) => {
      const { [chatId]: _removed, ...rest } = state.streaming;
      const { [chatId]: _removedController, ...restControllers } =
        state.abortControllers;
      return { streaming: rest, abortControllers: restControllers };
    }),

  getStreamingMessage: (chatId) => {
    const entry = get().streaming[chatId];
    if (!entry) return null;
    return {
      id: entry.messageId,
      chat_id: chatId,
      role: "assistant",
      content: entry.content,
      provider: entry.provider ?? null,
      model: entry.model ?? null,
      created_at: new Date().toISOString(),
    };
  },
}));
