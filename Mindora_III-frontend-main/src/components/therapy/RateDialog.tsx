"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRateAppointment } from "@/hooks/useAppointments";
import type { BookedAppointment } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RateDialogProps {
  appointment: BookedAppointment | null;
  therapistName: string;
  onOpenChange: (open: boolean) => void;
}

export function RateDialog({ appointment, therapistName, onOpenChange }: RateDialogProps) {
  const [rating, setRating] = useState(0);
  const rateMutation = useRateAppointment();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setRating(0);
      rateMutation.reset();
    }
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!appointment || rating === 0) return;
    try {
      await rateMutation.mutateAsync({ id: appointment.id, rating });
      handleOpenChange(false);
    } catch {
      // Surfaced via rateMutation.isError below - nothing more to do here.
    }
  }

  return (
    <Dialog open={!!appointment} onOpenChange={handleOpenChange}>
      <DialogContent className="text-center sm:max-w-[360px]">
        {appointment && (
          <>
            <DialogHeader>
              <DialogTitle>Rate your session</DialogTitle>
              <p className="text-[13px] text-muted-foreground">With {therapistName}</p>
            </DialogHeader>

            <div>
              <div className="mb-5 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={cn(star <= rating ? "text-amber-500" : "text-muted")}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star className="h-8 w-8" fill={star <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              {rateMutation.isError && (
                <div className="mb-3 rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
                  {rateMutation.error?.message ?? "Could not submit rating."}
                </div>
              )}

              <div className="flex justify-center gap-2.5">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={rating === 0 || rateMutation.isPending}>
                  {rateMutation.isPending ? "Submitting…" : "Submit rating"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
