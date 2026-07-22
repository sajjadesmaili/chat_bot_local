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
    mutationFn: (documentId: string) => {
      // #region agent log
      fetch("http://127.0.0.1:7331/ingest/aa4562a6-4206-4cc3-817a-00e119ebfed1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "3d5e50",
        },
        body: JSON.stringify({
          sessionId: "3d5e50",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "useDocuments.ts:useDeleteDocument",
          message: "Hook calling documentsApi.remove",
          data: {
            documentId,
            projectId,
            passesProjectIdToApi: false,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      // Intentionally not passing projectId yet (pre-fix probe for hypothesis B)
      return documentsApi.remove(documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(projectId),
      });
    },
  });
}
