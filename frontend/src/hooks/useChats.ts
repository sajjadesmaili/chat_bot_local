import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CreateChatPayload, UpdateChatPayload } from "@/lib/types";

export function useChats(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chats(projectId ?? ""),
    queryFn: () => chatsApi.listByProject(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useChat(chatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat(chatId ?? ""),
    queryFn: () => chatsApi.get(chatId as string),
    enabled: Boolean(chatId),
  });
}

export function useCreateChat(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatPayload = {}) =>
      chatsApi.createInProject(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chats(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateChat(chatId: string, projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateChatPayload) => chatsApi.update(chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat(chatId) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats(projectId) });
      }
    },
  });
}

export function useDeleteChat(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatsApi.remove(chatId),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats(projectId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
