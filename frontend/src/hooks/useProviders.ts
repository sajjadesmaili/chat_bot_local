import { useQuery } from "@tanstack/react-query";
import { providersApi, healthApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: providersApi.list,
    refetchInterval: 30_000,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthApi.get,
    refetchInterval: 30_000,
    retry: 0,
  });
}
