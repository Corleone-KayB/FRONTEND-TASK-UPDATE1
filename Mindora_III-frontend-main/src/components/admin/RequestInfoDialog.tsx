"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRequestTherapistApplicationInfo } from "@/hooks/useAdmin";

interface RequestInfoDialogProps {
  applicationId: string | null;
  applicantName?: string;
  onOpenChange: (open: boolean) => void;
}

export function RequestInfoDialog({
  applicationId,
  applicantName,
  onOpenChange,
}: RequestInfoDialogProps) {
  const [note, setNote] = useState("");
  const mutation = useRequestTherapistApplicationInfo();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setNote("");
      mutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!applicationId || !note.trim()) return;
    try {
      await mutation.mutateAsync({ id: applicationId, note: note.trim() });
      handleOpenChange(false);
    } catch {
      // Surfaced via mutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!applicationId} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        {applicationId && (
          <>
            <DialogHeader>
              <DialogTitle>
                Request more info{applicantName ? ` from ${applicantName}` : ""}
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                The application moves to &quot;More info needed&quot; and becomes editable again for
                the applicant.
              </p>
            </DialogHeader>

            <div>
              <label
                htmlFor="request-info-note"
                className="mb-2 block text-[12.5px] font-bold text-popover-foreground/75"
              >
                Note
              </label>
              <Textarea
                id="request-info-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                maxLength={1000}
                placeholder="What's missing or needs clarification? (1–1000 characters)"
                className="min-h-[100px]"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {note.length}/1000
              </p>

              {mutation.isError && (
                <div className="mt-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {mutation.error?.message ?? "Could not send this request."}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={note.trim().length === 0 || mutation.isPending}
                >
                  {mutation.isPending ? "Sending…" : "Request info"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
