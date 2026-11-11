"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReactivateTherapist, useSuspendTherapist } from "@/hooks/useAdmin";

interface SuspendTherapistTarget {
  userId: string;
  name: string;
  action: "suspend" | "reactivate";
}

interface SuspendTherapistDialogProps {
  target: SuspendTherapistTarget | null;
  onOpenChange: (open: boolean) => void;
}

// A distinct dialog from SuspendUserDialog - this calls the therapist-specific
// /api/v1/admin/therapists/:id/suspend|reactivate routes, not the generic
// /api/v1/admin/users/:id ones, since an approved therapist's account is
// managed through the therapist application flow.
export function SuspendTherapistDialog({ target, onOpenChange }: SuspendTherapistDialogProps) {
  const [reason, setReason] = useState("");
  const suspendMutation = useSuspendTherapist();
  const reactivateMutation = useReactivateTherapist();
  const mutation = target?.action === "suspend" ? suspendMutation : reactivateMutation;
  const actionLabel = target?.action === "suspend" ? "Suspend" : "Reactivate";

  function handleOpenChange(open: boolean) {
    if (!open) {
      setReason("");
      suspendMutation.reset();
      reactivateMutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!target || !reason.trim()) return;
    try {
      await mutation.mutateAsync({ id: target.userId, reason: reason.trim() });
      handleOpenChange(false);
    } catch {
      // Surfaced via mutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle>
                {actionLabel} {target.name}
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                {target.action === "suspend"
                  ? "Their therapist access is revoked immediately."
                  : "Their therapist access is restored immediately."}
              </p>
            </DialogHeader>

            <div>
              <label
                htmlFor="therapist-action-reason"
                className="mb-2 block text-[12.5px] font-bold text-popover-foreground/75"
              >
                Reason
              </label>
              <Textarea
                id="therapist-action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Why are you taking this action? (1–500 characters)"
                className="min-h-[90px]"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {reason.length}/500
              </p>

              {mutation.isError && (
                <div className="mt-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {mutation.error?.message ??
                    `Could not ${actionLabel.toLowerCase()} this therapist.`}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={reason.trim().length === 0 || mutation.isPending}
                  className={
                    target.action === "suspend"
                      ? "bg-destructive text-white hover:bg-destructive/90"
                      : undefined
                  }
                >
                  {mutation.isPending ? `${actionLabel}ing…` : actionLabel}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
