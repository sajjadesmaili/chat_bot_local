import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { UpdateSettingsPayload } from "@/lib/types";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => settingsApi.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings, data);
    },
  });
}
