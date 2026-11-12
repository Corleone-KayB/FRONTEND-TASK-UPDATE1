"use client";

import { AlertTriangle, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCrisis } from "@/contexts/CrisisContext";
import { CRISIS_LINE, EMERGENCY_HREF, EMERGENCY_NUMBER } from "@/lib/crisis";

export function CrisisOverlay() {
  const { isOpen, message, dismiss } = useCrisis();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent
        role="alertdialog"
        showCloseButton={false}
        className="max-h-[100dvh] overflow-y-auto border-2 border-red-300 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:auto-rows-min max-sm:content-center max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-w-md"
      >
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
          <DialogTitle className="text-lg font-bold">You are not alone</DialogTitle>
        </div>
        <DialogDescription className="text-[15px] leading-relaxed text-foreground">
          {message ??
            "It sounds like you may be going through something very painful. Please reach out for help right now."}
        </DialogDescription>

        <a
          href={EMERGENCY_HREF}
          autoFocus
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-lg font-bold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          Emergency: call {EMERGENCY_NUMBER}
        </a>
        <a
          href={CRISIS_LINE.href}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-red-300 px-4 text-base font-semibold text-red-800 hover:bg-red-50"
        >
          Mindora crisis line: {CRISIS_LINE.display}
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-12 rounded-xl px-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          I&apos;m safe right now
        </button>
      </DialogContent>
    </Dialog>
  );
}
