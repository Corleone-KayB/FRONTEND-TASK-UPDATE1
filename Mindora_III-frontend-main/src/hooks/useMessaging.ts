"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectMessagingSocket,
  disconnectMessagingSocket,
  reconnectMessagingSocket,
  registerPresence,
  sendHeartbeat,
  logoutPresence,
  joinConversation,
  sendMessage as emitSendMessage,
  markRead as emitMarkRead,
  markConversationRead as emitMarkConversationRead,
  startTyping as emitStartTyping,
  stopTyping as emitStopTyping,
} from "@/lib/messaging-socket";
import {
  createConversation as createConversationRequest,
  fetchConversations,
  fetchPresence,
} from "@/lib/messaging-api";
import { getAccessToken, onAccessTokenChange } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationListResponse, ConversationSummary, Message } from "@/types/domain";

const HEARTBEAT_INTERVAL_MS = 30_000;
const TYPING_REEMIT_MS = 3_000;
const TYPING_STOP_TIMEOUT_MS = 4_000;
// Safety net only - the server now guarantees an explicit stop event within ~5s
// of a client disappearing, so this should rarely fire in practice.
const TYPING_STALE_MS = 7_000;

const CONVERSATIONS_QUERY_KEY = ["messaging", "conversations"] as const;

export function useMessaging() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>(
    {}
  );
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [lastSeenByUserId, setLastSeenByUserId] = useState<Record<string, string | null>>({});
  const [typingByConversation, setTypingByConversation] = useState<Record<string, Set<string>>>({});
  const activeConversationRef = useRef<string | null>(null);
  const typingClearTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => fetchConversations({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const patchConversations = useCallback(
    (updater: (list: ConversationSummary[]) => ConversationSummary[]) => {
      queryClient.setQueryData<ConversationListResponse | undefined>(
        CONVERSATIONS_QUERY_KEY,
        (prev) => (prev ? { ...prev, conversations: updater(prev.conversations) } : prev)
      );
    },
    [queryClient]
  );

  const upsertConversation = useCallback(
    (next: ConversationSummary) => {
      patchConversations((list) => {
        const idx = list.findIndex((c) => c.conversationId === next.conversationId);
        if (idx === -1) return [next, ...list];
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...next };
        return copy;
      });
    },
    [patchConversations]
  );

  // Marks the currently-open conversation read, but only while the tab actually
  // has focus - called on open, on window focus, and on a fresh incoming message
  // while both already hold, so ticks/badges track an active chat in real time
  // instead of only catching up the next time the conversation is reopened.
  const markActiveConversationRead = useCallback(() => {
    const id = activeConversationRef.current;
    if (id && document.hasFocus()) emitMarkConversationRead(id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const token = getAccessToken();
    if (!token) return;

    const socket = connectMessagingSocket(token);

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      registerPresence();
    });
    socket.on("disconnect", () => setIsConnected(false));
    // Without this, a rejected handshake (expired/invalid token, unreachable
    // socket host - a genuinely different host from the REST gateway) leaves
    // isConnected stuck at false forever with zero visible signal anywhere in
    // the UI. socket.io keeps retrying on its own, but nothing here ever told
    // the user why the composer stayed disabled or why a deep-linked chat
    // never opened.
    socket.on("connect_error", (err) => {
      setConnectionError(err.message || "Could not connect to messaging.");
    });

    // No participant info on this event anymore - REST is the source of truth
    // for that now, this just confirms the room join went through.
    socket.on("joined_conversation", () => {});

    socket.on("conversation_created", () => {
      // Payload shape isn't fully specified server-side for this event - refetch
      // from REST rather than guess at merging fields, so a conversation someone
      // else started with this user shows up without a manual refresh.
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    });

    socket.on("message_history", ({ conversationId, messages }) => {
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: messages }));
    });

    socket.on("new_message", (message) => {
      setMessagesByConversation((prev) => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] ?? []), message],
      }));
      patchConversations((list) =>
        list.map((c) =>
          c.conversationId === message.conversationId
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        )
      );
      if (
        message.senderId !== user.userId &&
        activeConversationRef.current === message.conversationId
      ) {
        markActiveConversationRead();
      }
    });

    // Batched - mark every id in the array, not one at a time.
    socket.on("messages_delivered", ({ conversationId, messageIds, deliveredAt }) => {
      const ids = new Set(messageIds);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) =>
          ids.has(m._id) ? { ...m, deliveredAt } : m
        ),
      }));
    });

    socket.on("message_read", ({ conversationId, messageId, readAt }) => {
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) =>
          m._id === messageId ? { ...m, readAt } : m
        ),
      }));
    });

    // Broadcast to the whole conversation from mark_conversation_read - the
    // sender's copy uses it for blue ticks, the reader's copy uses it to clear
    // their own unread badge (driven by this event, not optimistic local state).
    socket.on("conversation_read", ({ conversationId, messageIds, readAt }) => {
      const ids = new Set(messageIds);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((m) =>
          ids.has(m._id) ? { ...m, readAt } : m
        ),
      }));
      patchConversations((list) =>
        list.map((c) => (c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    });

    socket.on("user_typing", ({ conversationId, userId }) => {
      setTypingByConversation((prev) => {
        const next = new Set(prev[conversationId] ?? []);
        next.add(userId);
        return { ...prev, [conversationId]: next };
      });
      // Safety-net auto-clear in case an explicit stop event never arrives.
      const timerKey = `${conversationId}:${userId}`;
      clearTimeout(typingClearTimersRef.current[timerKey]);
      typingClearTimersRef.current[timerKey] = setTimeout(() => {
        setTypingByConversation((prev) => {
          const next = new Set(prev[conversationId] ?? []);
          next.delete(userId);
          return { ...prev, [conversationId]: next };
        });
      }, TYPING_STALE_MS);
    });

    socket.on("user_stopped_typing", ({ conversationId, userId }) => {
      clearTimeout(typingClearTimersRef.current[`${conversationId}:${userId}`]);
      setTypingByConversation((prev) => {
        const next = new Set(prev[conversationId] ?? []);
        next.delete(userId);
        return { ...prev, [conversationId]: next };
      });
    });

    socket.on("presence_changed", ({ userId, online, lastSeen }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
      setLastSeenByUserId((prev) => ({ ...prev, [userId]: lastSeen }));
    });

    const heartbeat = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Reconnect (or disconnect on logout) whenever the app-wide access token
    // changes - this is what keeps the socket off a stale token after apiFetch's
    // silent 401 refresh, not just at login/logout.
    const unsubscribeToken = onAccessTokenChange((nextToken) => {
      if (nextToken) reconnectMessagingSocket(nextToken);
      else disconnectMessagingSocket();
    });

    function handleFocus() {
      markActiveConversationRead();
    }
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", logoutPresence);

    return () => {
      clearInterval(heartbeat);
      unsubscribeToken();
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", logoutPresence);
      Object.values(typingClearTimersRef.current).forEach(clearTimeout);
      typingClearTimersRef.current = {};
      logoutPresence();
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("joined_conversation");
      socket.off("conversation_created");
      socket.off("message_history");
      socket.off("new_message");
      socket.off("messages_delivered");
      socket.off("message_read");
      socket.off("conversation_read");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("presence_changed");
      disconnectMessagingSocket();
    };
  }, [isAuthenticated, user, queryClient, patchConversations, markActiveConversationRead]);

  const openConversation = useCallback(
    (conversationId: string) => {
      activeConversationRef.current = conversationId;
      joinConversation(conversationId);
      markActiveConversationRead();

      // Best-effort seed for the header's online/last-seen line before any
      // presence_changed event has fired for this person - that event keeps it
      // live from here on regardless of whether this lookup succeeds.
      const list = queryClient.getQueryData<ConversationListResponse>(CONVERSATIONS_QUERY_KEY);
      const conversation = list?.conversations.find((c) => c.conversationId === conversationId);
      if (conversation) {
        fetchPresence(conversation.participantId)
          .then(({ online, lastSeen }) => {
            setOnlineUserIds((prev) => {
              const next = new Set(prev);
              if (online) next.add(conversation.participantId);
              else next.delete(conversation.participantId);
              return next;
            });
            setLastSeenByUserId((prev) => ({ ...prev, [conversation.participantId]: lastSeen }));
          })
          .catch(() => {});
      }
    },
    [queryClient, markActiveConversationRead]
  );

  const closeConversation = useCallback(() => {
    activeConversationRef.current = null;
  }, []);

  // POST /conversations is a create-or-get - always safe to call directly
  // instead of first checking the local list for an existing match.
  const startConversationWith = useCallback(
    async (participantId: string) => {
      const conversation = await createConversationRequest(participantId);
      upsertConversation(conversation);
      openConversation(conversation.conversationId);
      return conversation.conversationId;
    },
    [upsertConversation, openConversation]
  );

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!content.trim()) return;
    emitSendMessage(conversationId, content.trim());
  }, []);

  const markMessageRead = useCallback((conversationId: string, messageId: string) => {
    emitMarkRead(conversationId, messageId);
  }, []);

  const typingTimersRef = useRef<
    Record<string, { reemit: ReturnType<typeof setInterval>; stop: ReturnType<typeof setTimeout> }>
  >({});

  function stopTypingNow(conversationId: string) {
    const entry = typingTimersRef.current[conversationId];
    if (!entry) return;
    clearInterval(entry.reemit);
    clearTimeout(entry.stop);
    delete typingTimersRef.current[conversationId];
    emitStopTyping(conversationId);
  }

  // Call on every composer keystroke. Emits typing_start immediately, then
  // re-emits roughly every 3s for as long as the user keeps typing (so the
  // indicator doesn't lapse on the recipient's end), and auto-stops after a
  // short pause with no further keystrokes.
  const notifyTyping = useCallback((conversationId: string) => {
    let entry = typingTimersRef.current[conversationId];
    if (!entry) {
      emitStartTyping(conversationId);
      entry = {
        reemit: setInterval(() => emitStartTyping(conversationId), TYPING_REEMIT_MS),
        stop: setTimeout(() => stopTypingNow(conversationId), TYPING_STOP_TIMEOUT_MS),
      };
      typingTimersRef.current[conversationId] = entry;
      return;
    }
    clearTimeout(entry.stop);
    entry.stop = setTimeout(() => stopTypingNow(conversationId), TYPING_STOP_TIMEOUT_MS);
  }, []);

  // Call immediately on send, rather than waiting for the stop-typing timeout.
  const stopTyping = useCallback((conversationId: string) => {
    stopTypingNow(conversationId);
  }, []);

  useEffect(() => {
    const timers = typingTimersRef.current;
    return () => {
      Object.values(timers).forEach(({ reemit, stop }) => {
        clearInterval(reemit);
        clearTimeout(stop);
      });
    };
  }, []);

  const sortedConversations = [...(conversationsQuery.data?.conversations ?? [])].sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  );

  return {
    isConnected,
    connectionError,
    conversations: sortedConversations,
    conversationsLoading: conversationsQuery.isLoading,
    conversationsError: conversationsQuery.isError,
    messagesByConversation,
    onlineUserIds,
    lastSeenByUserId,
    typingByConversation,
    openConversation,
    closeConversation,
    startConversationWith,
    sendMessage,
    markMessageRead,
    notifyTyping,
    stopTyping,
  };
}
