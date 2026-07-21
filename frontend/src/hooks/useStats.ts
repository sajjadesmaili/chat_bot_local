import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: statsApi.get,
    refetchInterval: 30_000,
  });
}
