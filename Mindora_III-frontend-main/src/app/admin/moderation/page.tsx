"use client";

import { ShieldOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useModerationQueue } from "@/hooks/useAdmin";

export default function AdminModerationPage() {
  const { data, isLoading, isError, error } = useModerationQueue({ limit: 50 });
  const isServiceUnavailable = error instanceof ApiError && error.status === 503;

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Moderation</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Pending community reports, proxied live from the Community Service.
        </p>
      </div>

      {isLoading && (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading moderation queue…</p>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-[34px] bg-white py-16 text-center shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-muted-foreground shadow-[inset_4px_4px_9px_#cdc6e0,inset_-4px_-4px_9px_#fdfbff]">
            <ShieldOff className="h-6 w-6" />
          </div>
          <p className="mb-1 text-[15px] font-bold text-foreground">Moderation is unavailable</p>
          <p className="max-w-sm text-[13.5px] text-muted-foreground">
            {isServiceUnavailable
              ? "Community Service isn't deployed yet, so there's nothing to moderate."
              : (error?.message ?? "Could not load the moderation queue.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && (data?.reports.length ?? 0) === 0 && (
        <p className="py-8 text-center text-[13.5px] text-muted-foreground">No pending reports.</p>
      )}
    </div>
  );
}
