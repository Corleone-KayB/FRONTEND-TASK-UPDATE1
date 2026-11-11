"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRejectTherapistApplication } from "@/hooks/useAdmin";

interface RejectApplicationDialogProps {
  applicationId: string | null;
  applicantName?: string;
  onOpenChange: (open: boolean) => void;
}

export function RejectApplicationDialog({
  applicationId,
  applicantName,
  onOpenChange,
}: RejectApplicationDialogProps) {
  const [reason, setReason] = useState("");
  const mutation = useRejectTherapistApplication();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setReason("");
      mutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!applicationId || !reason.trim()) return;
    try {
      await mutation.mutateAsync({ id: applicationId, reason: reason.trim() });
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
                Reject{applicantName ? ` ${applicantName}'s` : " this"} application
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                The applicant will not be able to edit or resubmit this application. They can start
                a new one later.
              </p>
            </DialogHeader>

            <div>
              <label
                htmlFor="reject-application-reason"
                className="mb-2 block text-[12.5px] font-bold text-popover-foreground/75"
              >
                Reason
              </label>
              <Textarea
                id="reject-application-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                maxLength={1000}
                placeholder="Why is this application being rejected? (1–1000 characters)"
                className="min-h-[100px]"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {reason.length}/1000
              </p>

              {mutation.isError && (
                <div className="mt-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {mutation.error?.message ?? "Could not reject this application."}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={reason.trim().length === 0 || mutation.isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {mutation.isPending ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
