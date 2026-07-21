import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents(projectId ?? ""),
    queryFn: () => documentsApi.listByProject(projectId as string),
    enabled: Boolean(projectId),
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasProcessing = docs?.some((d) => d.status === "processing");
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(projectId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.remove(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(projectId),
      });
    },
  });
}
