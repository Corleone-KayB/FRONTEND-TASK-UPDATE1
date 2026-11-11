"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCancelAppointment } from "@/hooks/useAppointments";
import type { BookedAppointment } from "@/types/domain";

interface CancelDialogProps {
  appointment: BookedAppointment | null;
  therapistName: string;
  onOpenChange: (open: boolean) => void;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CancelDialog({ appointment, therapistName, onOpenChange }: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const cancelMutation = useCancelAppointment();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setReason("");
      cancelMutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!appointment || !reason.trim()) return;
    try {
      await cancelMutation.mutateAsync({ id: appointment.id, reason: reason.trim() });
      handleOpenChange(false);
    } catch {
      // Surfaced via cancelMutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!appointment} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        {appointment && (
          <>
            <DialogHeader>
              <DialogTitle>Cancel appointment</DialogTitle>
              <p className="text-[13px] text-muted-foreground">
                With {therapistName} · {fmtWhen(appointment.slotStart)}
              </p>
            </DialogHeader>

            <div>
              <label
                htmlFor="cancel-reason"
                className="mb-2 block text-[12.5px] font-bold text-popover-foreground/75"
              >
                Reason for cancelling
              </label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Let them know why you're cancelling (1–500 characters)"
                className="min-h-[90px]"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {reason.length}/500
              </p>

              {cancelMutation.isError && (
                <div className="mt-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {cancelMutation.error?.message ?? "Could not cancel this appointment."}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Keep it
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={reason.trim().length === 0 || cancelMutation.isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Cancel appointment"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
