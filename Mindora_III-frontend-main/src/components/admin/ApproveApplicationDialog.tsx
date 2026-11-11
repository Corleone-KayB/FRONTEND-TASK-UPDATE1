"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApproveTherapistApplication } from "@/hooks/useAdmin";

interface ApproveApplicationDialogProps {
  applicationId: string | null;
  applicantName?: string;
  onOpenChange: (open: boolean) => void;
}

export function ApproveApplicationDialog({
  applicationId,
  applicantName,
  onOpenChange,
}: ApproveApplicationDialogProps) {
  const mutation = useApproveTherapistApplication();

  function handleOpenChange(open: boolean) {
    if (!open) mutation.reset();
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!applicationId) return;
    try {
      await mutation.mutateAsync(applicationId);
      handleOpenChange(false);
    } catch {
      // Surfaced via mutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!applicationId} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {applicationId && (
          <>
            <DialogHeader>
              <DialogTitle>
                Approve{applicantName ? ` ${applicantName}'s` : " this"} application
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                This grants the applicant the THERAPIST role immediately and makes their profile
                visible to patients.
              </p>
            </DialogHeader>

            <div>
              {mutation.isError && (
                <div className="mb-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {mutation.error?.message ?? "Could not approve this application."}
                </div>
              )}

              <div className="flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={mutation.isPending}>
                  {mutation.isPending ? "Approving…" : "Approve"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
