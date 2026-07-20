import { useQuery } from "@tanstack/react-query";
import { logsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useLogs(params?: { level?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.logs(params),
    queryFn: () => logsApi.list(params),
    refetchInterval: 15_000,
  });
}
