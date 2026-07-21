export const queryKeys = {
  health: ["health"] as const,
  providers: ["providers"] as const,
  stats: ["stats"] as const,
  settings: ["settings"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  chats: (projectId: string) => ["projects", projectId, "chats"] as const,
  chat: (id: string) => ["chats", id] as const,
  messages: (chatId: string) => ["chats", chatId, "messages"] as const,
  documents: (projectId: string) =>
    ["projects", projectId, "documents"] as const,
  logs: (params?: { level?: string; limit?: number }) =>
    ["logs", params ?? {}] as const,
};
