import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAiHistory, fetchAiHistory, sendChatMessage } from "@/lib/ai-api";

export function useAiHistory(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["ai", "history", params],
    queryFn: () => fetchAiHistory(params),
  });
}

// No toast on success/error here - ReflectChat renders both states inline in
// the transcript itself (optimistic bubble, thinking indicator, inline retry).
export function useSendAiChat() {
  return useMutation({ mutationFn: sendChatMessage });
}

export function useDeleteAiHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAiHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "history"] });
    },
  });
}
