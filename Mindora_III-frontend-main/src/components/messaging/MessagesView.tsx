"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/hooks/useMessaging";
import { fetchConversationHistory } from "@/lib/messaging-api";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/domain";

const OLDER_PAGE_SIZE = 30;

function initialsFor(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .slice(-2)
    .map((w) => w[0])
    .join("");
}

function fmtListTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtLastSeen(iso: string | null): string {
  if (!iso) return "Offline";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay
    ? `Last seen ${time}`
    : `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

// Delivery/read ticks - only ever rendered on messages the current user sent.
// Two ticks never regress to one when the recipient goes offline: deliveredAt is
// true persisted delivery (set once the recipient actually opened the
// conversation), not a presence signal, and it never changes once set.
function MessageTicks({ message }: { message: Message }) {
  if (message.readAt) return <CheckCheck className="h-3.5 w-3.5 text-sky-300" />;
  if (message.deliveredAt) return <CheckCheck className="h-3.5 w-3.5 text-white/55" />;
  return <Check className="h-3.5 w-3.5 text-white/55" />;
}

export function MessagesView() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isConnected,
    connectionError,
    conversations,
    conversationsLoading,
    conversationsError,
    messagesByConversation,
    onlineUserIds,
    lastSeenByUserId,
    typingByConversation,
    openConversation,
    closeConversation,
    startConversationWith,
    sendMessage,
    notifyTyping,
    stopTyping,
  } = useMessaging();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [olderMessages, setOlderMessages] = useState<Record<string, Message[]>>({});
  const [noMoreOlder, setNoMoreOlder] = useState<Record<string, boolean>>({});
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedFromQueryRef = useRef(false);

  // Deep link from a therapist's "Chat with this therapist" option. POST
  // .../conversations is a create-or-get, so this always resolves to the right
  // conversation id whether or not one already existed.
  useEffect(() => {
    const therapistId = searchParams.get("therapistId");
    if (!therapistId || !isConnected || startedFromQueryRef.current) return;
    startedFromQueryRef.current = true;
    router.replace("/messages");
    startConversationWith(therapistId)
      .then((conversationId) => setSelectedId(conversationId))
      .catch(() => {
        setDeepLinkError("Couldn't start a chat with that therapist. Please try again.");
      });
  }, [isConnected, searchParams, router, startConversationWith]);

  // The above effect only ever fires once isConnected flips true - if the
  // socket's handshake fails outright (expired token, messaging host
  // unreachable - a real, separate host from the REST API), isConnected stays
  // false forever and that effect never runs at all, with no feedback. This
  // catches that case instead of leaving a deep-linked visitor staring at the
  // generic "select a conversation" screen with no idea anything went wrong.
  useEffect(() => {
    const therapistId = searchParams.get("therapistId");
    if (!therapistId || startedFromQueryRef.current || !connectionError) return;
    startedFromQueryRef.current = true;
    router.replace("/messages");
    setDeepLinkError("Couldn't reach messaging right now. Please try again in a moment.");
  }, [connectionError, searchParams, router]);

  useEffect(() => {
    if (selectedId) openConversation(selectedId);
    return () => closeConversation();
  }, [selectedId, openConversation, closeConversation]);

  const liveMessages = selectedId ? (messagesByConversation[selectedId] ?? []) : [];
  const older = selectedId ? (olderMessages[selectedId] ?? []) : [];
  const messages = [...older, ...liveMessages];

  // Keyed on liveMessages.length specifically (not the combined messages array)
  // so loading older history above the fold doesn't yank the scroll position
  // back down to the bottom.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages.length]);

  const selectedConversation = conversations.find((c) => c.conversationId === selectedId) ?? null;
  const typingUsers = (selectedId && typingByConversation[selectedId]) || new Set<string>();
  const otherIsTyping =
    !!selectedConversation && typingUsers.has(selectedConversation.participantId);
  const otherOnline =
    !!selectedConversation && onlineUserIds.has(selectedConversation.participantId);

  async function handleLoadOlder() {
    if (!selectedId || loadingOlder) return;
    setLoadingOlder(true);
    try {
      // The oldest message currently loaded (from either an earlier page or the
      // initial socket message_history) is the cursor to page further back from.
      const cursor = messages[0]?._id;
      const page = await fetchConversationHistory(selectedId, {
        limit: OLDER_PAGE_SIZE,
        cursor,
      });
      // REST paging is newest-first; the in-memory log is oldest-first
      // top-to-bottom, so reverse each page before splicing it onto the front.
      const reversed = [...page.messages].reverse();
      setOlderMessages((prev) => ({
        ...prev,
        [selectedId]: [...reversed, ...(prev[selectedId] ?? [])],
      }));
      setNoMoreOlder((prev) => ({ ...prev, [selectedId]: page.nextCursor === null }));
    } catch {
      // Best-effort - leave the button in place so the user can retry.
    } finally {
      setLoadingOlder(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!selectedId || !isConnected) return;
    notifyTyping(selectedId);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim() || !isConnected) return;
    sendMessage(selectedId, draft);
    stopTyping(selectedId);
    setDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#eae6f4] p-4 lg:p-6">
      {deepLinkError && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          {deepLinkError}
          <button
            type="button"
            onClick={() => setDeepLinkError(null)}
            className="shrink-0 text-[12px] font-semibold text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[34px] bg-white shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]">
        {/* Conversation list */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col sm:w-[320px] sm:shadow-[3px_0_10px_-4px_#cdc6e0]",
            selectedId && "hidden sm:flex"
          )}
        >
          <div className="px-5 py-5">
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
            {conversationsLoading && (
              <div className="space-y-1 p-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#eae6f4]/60" />
                ))}
              </div>
            )}

            {/* A failed fetch must never look like "no conversations" - that
                reads as "you have no one to talk to" when the truth is just
                "we couldn't check." Same principle as the streak/session cards. */}
            {!conversationsLoading && conversationsError ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-[3px_3px_8px_#e8d5d5,-3px_-3px_8px_#fdfbff]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-foreground">
                  Could not load your conversations
                </p>
                <p className="text-[13px] text-muted-foreground">
                  This doesn&apos;t mean you have none - try refreshing the page.
                </p>
              </div>
            ) : !conversationsLoading && conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mindora-purple-pale text-mindora-purple shadow-[3px_3px_8px_#c6bade,-3px_-3px_8px_#fdfbff]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <p className="text-[14px] font-semibold text-foreground">No conversations yet</p>
                <p className="text-[13px] text-muted-foreground">
                  Start one from a therapist&apos;s profile on the Therapy page.
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.conversationId}
                  type="button"
                  onClick={() => setSelectedId(c.conversationId)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3.5 text-left",
                    selectedId === c.conversationId &&
                      "shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mindora-purple text-[13px] font-bold text-white shadow-[2px_2px_6px_#c6bade,-2px_-2px_6px_#fdfbff]">
                      {initialsFor(c.participantName)}
                    </div>
                    {onlineUserIds.has(c.participantId) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-mindora-success" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-foreground">
                        {c.participantName ?? "Therapist"}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {fmtListTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {c.lastMessage ?? "Say hello"}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-mindora-purple px-1.5 text-[10.5px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("flex min-h-0 flex-1 flex-col", !selectedId && "hidden sm:flex")}>
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <MessageCircle className="mb-3 h-10 w-10 text-mindora-lavender" />
              <p className="text-[14px]">Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-4 shadow-[0_3px_10px_-4px_#cdc6e0]">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-muted-foreground sm:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-[12px] font-bold text-white shadow-[2px_2px_6px_#c6bade,-2px_-2px_6px_#fdfbff]">
                  {initialsFor(selectedConversation.participantName)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {selectedConversation.participantName ?? "Therapist"}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {otherIsTyping
                      ? "Typing…"
                      : otherOnline
                        ? "Online"
                        : fmtLastSeen(lastSeenByUserId[selectedConversation.participantId] ?? null)}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#eae6f4]/40 px-5 py-4">
                {!noMoreOlder[selectedId ?? ""] && messages.length > 0 && (
                  <div className="flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff] disabled:opacity-50"
                    >
                      {loadingOlder ? "Loading…" : "Load earlier messages"}
                    </button>
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.senderId === user?.userId;
                  return (
                    <div key={m._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-[13.5px]",
                          mine
                            ? "rounded-br-sm bg-mindora-purple text-white shadow-[3px_3px_8px_#c6bade,-3px_-3px_8px_#fdfbff]"
                            : "rounded-bl-sm bg-white text-foreground shadow-[3px_3px_8px_#cdc6e0,-3px_-3px_8px_#fdfbff]"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <div
                          className={cn(
                            "mt-1 flex items-center justify-end gap-1 text-[10px]",
                            mine ? "text-white/60" : "text-muted-foreground"
                          )}
                        >
                          {fmtBubbleTime(m.createdAt)}
                          {mine && <MessageTicks message={m} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {!isConnected && (
                <div className="bg-amber-50 px-4 py-2 text-center text-[12px] font-medium text-amber-700 shadow-[inset_0_3px_7px_-4px_#f3d9a8]">
                  Reconnecting… you can read messages, but sending is paused.
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2.5 px-4 py-3.5">
                <input
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder={isConnected ? "Type a message" : "Reconnecting…"}
                  disabled={!isConnected}
                  className="flex-1 rounded-full px-4 py-2.5 text-[13.5px] text-foreground shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mindora-purple/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !isConnected}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-white shadow-[3px_3px_8px_#c6bade,-3px_-3px_8px_#fdfbff] disabled:opacity-40 disabled:shadow-none"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
