import { apiFetch, ApiError } from "@/lib/api";
import { toQueryString } from "@/lib/query-string";
import type { AiHistoryResponse, ChatResponse, DeleteAiHistoryResponse } from "@/types/domain";

// Thrown instead of a plain ApiError on 429 so callers get a typed
// retryAfterSeconds without needing to know the raw error body shape. This is a
// genuine upstream rate limit (20 msgs/user/60s), not a soft warning - callers
// should disable the composer and count down, not auto-retry.
export class AiRateLimitError extends ApiError {
  retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message, 429);
    this.name = "AiRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// POST /api/v1/ai/chat - patient only. crisisLevel is 0-5; only 5 is a safety
// interstitial (see ChatResponse). No client-side timeout is set on this call -
// replies take 20-25s and the server's own timeout is 45s, so an early client
// timeout would abort a request that was still legitimately in flight.
export async function sendChatMessage(body: {
  message: string;
  sessionId?: string | null;
}): Promise<ChatResponse> {
  try {
    return await apiFetch<ChatResponse>("/api/v1/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      const retryAfterSeconds = (err.body as { retryAfterSeconds?: unknown } | undefined)
        ?.retryAfterSeconds;
      throw new AiRateLimitError(
        err.message,
        typeof retryAfterSeconds === "number" ? retryAfterSeconds : 60
      );
    }
    throw err;
  }
}

// GET /api/v1/ai/history - newest first. message/response are independently
// nullable (undecryptable rows) - render a placeholder, not an empty bubble.
export function fetchAiHistory(params: {
  page?: number;
  limit?: number;
}): Promise<AiHistoryResponse> {
  return apiFetch(`/api/v1/ai/history${toQueryString(params)}`);
}

// DELETE /api/v1/ai/history - remoteConversationDeleted can come back false,
// meaning the transcript may still exist on the third-party AI provider's
// servers. Callers must surface that, not report the deletion as complete.
export function deleteAiHistory(): Promise<DeleteAiHistoryResponse> {
  return apiFetch("/api/v1/ai/history", { method: "DELETE" });
}
