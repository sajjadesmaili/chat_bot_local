import { useQuery } from "@tanstack/react-query";
import { chatsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useMessages(chatId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(chatId ?? ""),
    queryFn: () => chatsApi.messages(chatId as string),
    enabled: Boolean(chatId),
  });
}
