"use client";

import { useAuditLog } from "@/hooks/useAdmin";

export default function AdminAuditLogPage() {
  const { data, isLoading, isError } = useAuditLog({ limit: 50 });
  const entries = data?.entries ?? [];

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Audit log</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Immutable record of every admin action - read-only.
        </p>
      </div>

      {isError && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load the audit log.
        </div>
      )}

      {isLoading ? (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading audit log…</p>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-[13.5px] text-muted-foreground">
          No admin actions recorded yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[26px] bg-white p-2 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-[18px] px-3.5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[14px] font-semibold text-foreground">{entry.actionType}</p>
                <p className="text-[12px] text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
              {entry.targetId && (
                <p className="mt-0.5 text-[12px] text-muted-foreground">Target: {entry.targetId}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
