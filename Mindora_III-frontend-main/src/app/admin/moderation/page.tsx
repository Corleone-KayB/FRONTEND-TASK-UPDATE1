"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useModerationQueue, useResolveModerationReport } from "@/hooks/useAdmin";
import type { ModerationReport } from "@/types/domain";

const ACTION_BUTTON =
  "rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-mindora-purple-dark shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff] disabled:opacity-50";

function ReportRow({ report }: { report: ModerationReport }) {
  const [reason, setReason] = useState("");
  const resolve = useResolveModerationReport();
  const disabled = resolve.isPending || reason.trim().length === 0;

  function submit(decision: "REMOVED" | "DISMISSED") {
    resolve.mutate({ id: report.id, decision, reason: reason.trim() });
  }

  return (
    <li className="flex flex-col gap-3 rounded-[18px] px-3.5 py-4">
      <div className="min-w-0">
        <p className="break-words text-[14px] font-semibold text-foreground">{report.reason}</p>
        <p className="mt-0.5 break-all text-[12px] text-muted-foreground">
          Post {report.postId} · reported {new Date(report.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-label={`Decision reason for report ${report.id}`}
          placeholder="Reason for your decision"
          className="h-10 min-w-0 flex-1 basis-48 rounded-xl bg-transparent px-3 text-[13px] shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff] outline-none"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => submit("REMOVED")}
          className={ACTION_BUTTON}
        >
          Remove post
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => submit("DISMISSED")}
          className={ACTION_BUTTON}
        >
          Dismiss
        </button>
      </div>
    </li>
  );
}

export default function AdminModerationPage() {
  const { data, isLoading, isError, error } = useModerationQueue({ limit: 50 });
  const reports = data?.reports ?? [];
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

      {!isLoading && !isError && reports.length === 0 && (
        <p className="py-8 text-center text-[13.5px] text-muted-foreground">No pending reports.</p>
      )}

      {!isLoading && !isError && reports.length > 0 && (
        <ul className="overflow-hidden rounded-[26px] bg-white p-2 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}
