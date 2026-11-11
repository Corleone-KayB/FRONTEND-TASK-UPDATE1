"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { useMoodReport } from "@/hooks/useMood";

interface MoodReportDialogProps {
  patientId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MoodReportDialog({ patientId, onOpenChange }: MoodReportDialogProps) {
  const { data, isLoading, isError, error } = useMoodReport(patientId);
  const isNoData = error instanceof ApiError && error.status === 404;

  return (
    <Dialog open={!!patientId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Mood summary</DialogTitle>
          <p className="text-[13px] text-muted-foreground">
            Last 30 days - journal notes stay private.
          </p>
        </DialogHeader>

        {isLoading && <p className="text-[13.5px] text-muted-foreground">Loading…</p>}

        {isError && !isNoData && (
          <div className="rounded-[9px] bg-red-100 px-3 py-2.5 text-[12.5px] font-semibold text-red-700">
            Could not load this patient&apos;s mood summary.
          </div>
        )}

        {isNoData && (
          <p className="text-[13.5px] text-muted-foreground">
            No mood data for this patient in the last 30 days.
          </p>
        )}

        {data && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Avg mood</p>
              <p className="mt-1 text-[22px] font-bold text-foreground">
                {data.avgMoodScore.toFixed(1)}/10
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Entries logged</p>
              <p className="mt-1 text-[22px] font-bold text-foreground">{data.entryCount}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
