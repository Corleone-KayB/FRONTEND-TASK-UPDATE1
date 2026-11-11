"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, RotateCcw, Trash2 } from "lucide-react";
import { useAiHistory, useSendAiChat } from "@/hooks/useAi";
import { DeleteAiHistoryDialog } from "@/components/reflect/DeleteAiHistoryDialog";
import { AiRateLimitError } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AiInteraction } from "@/types/domain";

interface TranscriptEntry {
  key: string;
  role: "user" | "assistant";
  content: string | null;
  crisis?: boolean; // assistant-only: this reply was the level-5 safety interstitial
  failed?: boolean; // user-only: this send failed, offer retry
}

// One history item is a full exchange (both sides) - split it into the two
// transcript rows it represents rather than pairing separate records.
function entriesFromInteraction(interaction: AiInteraction): TranscriptEntry[] {
  return [
    { key: `${interaction.id}-user`, role: "user", content: interaction.message },
    {
      key: `${interaction.id}-assistant`,
      role: "assistant",
      content: interaction.response,
      crisis: interaction.crisisLevel === 5,
    },
  ];
}

export function ReflectChat() {
  const [input, setInput] = useState("");
  const [liveEntries, setLiveEntries] = useState<TranscriptEntry[]>([]);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Date.now()/crypto.randomUUID() are impure and flagged if called anywhere
  // reachable from render, even though this only ever runs from event handlers -
  // a ref-backed counter is the sanctioned way to get unique keys here instead.
  const keySeqRef = useRef(0);
  function nextKey(prefix: string): string {
    keySeqRef.current += 1;
    return `${prefix}-${keySeqRef.current}`;
  }

  const { data: history, isLoading: historyLoading } = useAiHistory({ limit: 20 });
  const chatMutation = useSendAiChat();

  const historyEntries = useMemo(() => {
    const interactions = history?.interactions ?? [];
    // The API returns newest-first; a transcript reads oldest-first.
    return [...interactions].reverse().flatMap(entriesFromInteraction);
  }, [history]);

  const entries = [...historyEntries, ...liveEntries];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, chatMutation.isPending]);

  // 429 countdown ticks locally rather than re-hitting the endpoint - the spec
  // is explicit that this should never auto-retry.
  useEffect(() => {
    if (!rateLimitedUntil) return;
    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) setRateLimitedUntil(null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  const rateLimited = rateLimitedUntil !== null && remainingSeconds > 0;

  function submitMessage(content: string) {
    const userKey = nextKey("live-user");
    // Optimistic: the user's own message renders immediately, before the 20-25s
    // round trip even starts, so the screen is never blank while waiting.
    setLiveEntries((prev) => [...prev, { key: userKey, role: "user", content }]);

    chatMutation.mutate(
      { message: content, sessionId: sessionIdRef.current },
      {
        onSuccess: (data) => {
          sessionIdRef.current = data.sessionId;
          setLiveEntries((prev) => [
            ...prev,
            {
              key: nextKey("live-assistant"),
              role: "assistant",
              content: data.response,
              crisis: data.crisisLevel === 5,
            },
          ]);
        },
        onError: (err) => {
          if (err instanceof AiRateLimitError) {
            setRateLimitedUntil(Date.now() + err.retryAfterSeconds * 1000);
          }
          // Composer only ever allows one send in flight at a time, so the
          // failure unambiguously belongs to this specific optimistic entry.
          setLiveEntries((prev) =>
            prev.map((entry) => (entry.key === userKey ? { ...entry, failed: true } : entry))
          );
        },
      }
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending || rateLimited) return;
    setInput("");
    submitMessage(trimmed);
  }

  function retry(content: string, key: string) {
    if (chatMutation.isPending || rateLimited) return;
    setLiveEntries((prev) => prev.filter((entry) => entry.key !== key));
    submitMessage(content);
  }

  const isRateLimitError = chatMutation.error instanceof AiRateLimitError;
  const genericErrorMessage =
    !isRateLimitError && chatMutation.error instanceof ApiError
      ? chatMutation.error.message
      : !isRateLimitError && chatMutation.isError
        ? "Could not reach Mindora AI right now. Please try again."
        : null;

  const composerDisabled = chatMutation.isPending || rateLimited;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 lg:p-6">
      <div className="flex min-h-0 flex-1 flex-col rounded-[34px] bg-white p-6 shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff] lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Reflect</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              A safe space to untangle your thoughts, anytime. Not a replacement for care.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-destructive shadow-[5px_5px_12px_#cdc6e0,-5px_-5px_12px_#fdfbff]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete history
          </button>
        </div>

        <div className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {!historyLoading && entries.length === 0 && (
            <div className="rounded-2xl bg-mindora-purple-bg/40 px-5 py-6 text-center text-[13.5px] text-muted-foreground shadow-[inset_3px_3px_7px_#e3ddf3,inset_-3px_-3px_7px_#ffffff]">
              Start the conversation whenever you&apos;re ready.
            </div>
          )}

          {entries.map((entry) =>
            entry.role === "assistant" && entry.crisis ? (
              // Deliberately not styled as a bubble - full width, distinct color,
              // and a heading, so it can't be mistaken for an ordinary reply.
              // Text is rendered verbatim; this is clinically-approved copy.
              <div
                key={entry.key}
                className="flex items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-[14px] text-red-900 shadow-sm"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-red-700">
                    Safety notice
                  </p>
                  <p className="leading-relaxed">
                    {entry.content ?? "This message could not be displayed."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                key={entry.key}
                className={entry.role === "user" ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-[14px]",
                    entry.role === "user"
                      ? "rounded-br-md bg-mindora-purple text-white shadow-[3px_3px_8px_#c6bade,-3px_-3px_8px_#fdfbff]"
                      : "rounded-bl-md bg-mindora-purple-pale text-foreground shadow-[3px_3px_8px_#e3ddf3,-3px_-3px_8px_#ffffff]"
                  )}
                >
                  {entry.content ?? "This message could not be displayed."}
                </div>
                {entry.failed && (
                  <button
                    type="button"
                    onClick={() => retry(entry.content ?? "", entry.key)}
                    className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-red-600 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Failed to send - retry
                  </button>
                )}
              </div>
            )
          )}

          {chatMutation.isPending && (
            <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-mindora-purple-pale/50 px-4 py-3 shadow-[3px_3px_8px_#e3ddf3,-3px_-3px_8px_#ffffff]">
              <div className="flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mindora-purple [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mindora-purple [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mindora-purple" />
                </span>
                <span className="text-[13px] font-medium text-mindora-purple-dark">Thinking…</span>
              </div>
              {/* Honest framing on purpose - a bare spinner implies imminence and
                  makes a genuine 20-25s wait feel broken. */}
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                This can take up to 30 seconds.
              </p>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {isRateLimitError && rateLimited && (
          <div className="mt-3 rounded-2xl bg-mindora-purple-pale px-4 py-2.5 text-[13px] font-medium text-mindora-purple-dark shadow-[inset_3px_3px_7px_#d3caeb,inset_-3px_-3px_7px_#ffffff]">
            You&apos;ve sent a lot of messages - please wait {remainingSeconds}s before sending
            another.
          </div>
        )}

        {genericErrorMessage && (
          <div className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
            {genericErrorMessage}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 flex items-end gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={rateLimited ? `Wait ${remainingSeconds}s…` : "What's on your mind?"}
            rows={1}
            disabled={composerDisabled}
            className="min-h-12 flex-1 resize-none rounded-xl border-0 bg-transparent px-4 py-3 text-[14px] shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]"
          />
          <button
            type="submit"
            disabled={!input.trim() || composerDisabled}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-white shadow-[4px_4px_10px_#c6bade,-4px_-4px_10px_#fdfbff] disabled:opacity-40 disabled:shadow-none"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>

      <DeleteAiHistoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => {
          setLiveEntries([]);
          sessionIdRef.current = null;
        }}
      />
    </div>
  );
}
