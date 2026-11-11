"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteAiHistory } from "@/hooks/useAi";
import { ApiError } from "@/lib/api";

interface DeleteAiHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteAiHistoryDialog({
  open,
  onOpenChange,
  onDeleted,
}: DeleteAiHistoryDialogProps) {
  const deleteMutation = useDeleteAiHistory();

  function handleOpenChange(next: boolean) {
    if (!next) deleteMutation.reset();
    onOpenChange(next);
  }

  function handleConfirm() {
    // Local rows are gone the moment this succeeds regardless of remote status -
    // the parent's transcript should reflect that immediately; the remote-pending
    // notice below is a separate, honest disclosure, not a reason to hold back
    // clearing what's actually already deleted here.
    deleteMutation.mutate(undefined, { onSuccess: () => onDeleted() });
  }

  const errorMessage =
    deleteMutation.error instanceof ApiError
      ? deleteMutation.error.message
      : deleteMutation.isError
        ? "Could not delete your chat history. Please try again."
        : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete chat history</DialogTitle>
        </DialogHeader>

        {deleteMutation.isSuccess ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-mindora-success-bg px-4 py-3.5 text-[13.5px] text-mindora-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Cleared {deleteMutation.data.localInteractionsDeleted}{" "}
                {deleteMutation.data.localInteractionsDeleted === 1 ? "exchange" : "exchanges"} from
                your history here.
              </p>
            </div>

            {/* Not the same as complete - a false here means the AI provider itself
                may still hold this data, which is the part users actually care
                about for a "delete my data" request. Never collapse this into the
                success message above. */}
            {!deleteMutation.data.remoteConversationDeleted && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-[13.5px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Removal from our AI provider is still pending and we&apos;re following up. This
                  can take longer to complete on their end.
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13.5px] text-muted-foreground">
              This clears your AI companion conversation history from Mindora. It can&apos;t be
              undone.
            </p>

            {errorMessage && (
              <div className="rounded-xl bg-red-100 px-4 py-2.5 text-[13px] font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-end gap-2.5 border-t border-border pt-4">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete history"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
