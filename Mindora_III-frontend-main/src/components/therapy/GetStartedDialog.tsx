"use client";

import { CalendarHeart, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TherapistProfile } from "@/types/domain";

interface GetStartedDialogProps {
  therapist: TherapistProfile | null;
  onOpenChange: (open: boolean) => void;
  onBookAppointment: () => void;
  onChat: () => void;
}

export function GetStartedDialog({
  therapist,
  onOpenChange,
  onBookAppointment,
  onChat,
}: GetStartedDialogProps) {
  return (
    <Dialog open={!!therapist} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        {therapist && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-sm font-bold text-white">
                  {(therapist.userName ?? "?")
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <DialogTitle>{therapist.userName ?? "Therapist"}</DialogTitle>
                  <p className="text-[12.5px] text-muted-foreground">{therapist.specialisation}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onBookAppointment}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3.5 text-left hover:border-mindora-purple hover:bg-mindora-purple-pale/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mindora-purple-pale text-mindora-purple">
                  <CalendarHeart className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-foreground">
                    Book an appointment
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    Schedule a video or audio session.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={onChat}
                className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3.5 text-left hover:border-mindora-purple hover:bg-mindora-purple-pale/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mindora-purple-pale text-mindora-purple">
                  <MessageCircle className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-foreground">
                    Chat with {therapist.userName ?? "this therapist"}
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    Send a message any time.
                  </span>
                </span>
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
