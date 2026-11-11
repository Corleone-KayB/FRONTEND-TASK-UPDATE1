import { apiFetch } from "@/lib/api";
import { toQueryString } from "@/lib/query-string";
import type {
  ConversationHistoryResponse,
  ConversationListResponse,
  ConversationSummary,
  PresenceStatus,
} from "@/types/domain";

// POST /api/v1/messaging/conversations - 201 for a new conversation, 200 if one
// already exists with this participant. Idempotent, so this is safe to call every
// time a "Chat with this therapist" action is clicked, no need to check first.
export function createConversation(participantId: string): Promise<ConversationSummary> {
  return apiFetch("/api/v1/messaging/conversations", {
    method: "POST",
    body: JSON.stringify({ participantId }),
  });
}

// GET /api/v1/messaging/conversations - limit max 50.
export function fetchConversations(params: {
  page?: number;
  limit?: number;
}): Promise<ConversationListResponse> {
  return apiFetch(`/api/v1/messaging/conversations${toQueryString(params)}`);
}

// GET /api/v1/messaging/conversations/:id - newest-first. join_conversation's own
// message_history socket event already covers the most recent 50 on open; this is
// only for paging further back (pass the previous response's nextCursor as `cursor`).
// 403 not a participant, 404 not found, 400 bad id/cursor - all worded identically
// server-side ("not a participant" / "doesn't exist" / "malformed id" collapse to
// the same message), so don't write copy that asserts the conversation exists.
export function fetchConversationHistory(
  conversationId: string,
  params: { limit?: number; cursor?: string }
): Promise<ConversationHistoryResponse> {
  return apiFetch(`/api/v1/messaging/conversations/${conversationId}${toQueryString(params)}`);
}

// GET /api/v1/messaging/presence/:userId - one-off lookup for before any
// presence_changed socket event has fired for this person (e.g. right when a
// conversation is opened); presence_changed keeps it live after that.
export function fetchPresence(userId: string): Promise<PresenceStatus> {
  return apiFetch(`/api/v1/messaging/presence/${userId}`);
}
