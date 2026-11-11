"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteMoodEntry } from "@/hooks/useMood";
import type { MoodEntry } from "@/types/domain";

interface DeleteMoodEntryDialogProps {
  entry: MoodEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMoodEntryDialog({ entry, onOpenChange }: DeleteMoodEntryDialogProps) {
  const deleteMutation = useDeleteMoodEntry();

  function handleOpenChange(open: boolean) {
    if (!open) deleteMutation.reset();
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!entry) return;
    try {
      await deleteMutation.mutateAsync(entry.id);
      handleOpenChange(false);
    } catch {
      // Surfaced via useDeleteMoodEntry's own error toast - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!entry} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle>Delete this check-in?</DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                Mood {entry.moodScore}/10 &middot;{" "}
                {new Date(entry.recordedAt).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </DialogHeader>

            <p className="text-[13.5px] text-muted-foreground">This can&apos;t be undone.</p>

            <div className="mt-4 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Keep it
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
