"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTherapistPatients } from "@/hooks/useAppointments";

const LIMIT = 20;

function patientDisplayName(userName: string | null, patientId: string): string {
  return userName ?? `Patient ${patientId.slice(0, 8)}`;
}

function fmtLastSession(iso: string | null): string {
  if (!iso) return "No sessions yet";
  return `Last session ${new Date(iso).toLocaleDateString()}`;
}

export default function TherapistPatientsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTherapistPatients(page, LIMIT);

  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Patients</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Everyone you have an appointment history with.
        </p>
      </div>

      {isError && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load your patients.
        </div>
      )}

      {isLoading ? (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading patients…</p>
      ) : (
        <div className="overflow-hidden rounded-[26px] bg-white p-2 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
          <div className="flex items-center gap-4 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <span className="flex-1">Patient</span>
            <span className="w-[130px] shrink-0 text-right">Total sessions</span>
            <span className="w-[190px] shrink-0 text-right">Last session</span>
          </div>

          {patients.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-muted-foreground">
              You don&apos;t have any patients yet.
            </p>
          ) : (
            patients.map((p) => (
              <div key={p.patientId} className="flex items-center gap-4 rounded-[18px] px-3.5 py-4">
                <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
                  {patientDisplayName(p.userName, p.patientId)}
                </p>
                <p className="w-[130px] shrink-0 text-right text-[13px] text-foreground">
                  {p.totalSessions}
                </p>
                <p className="w-[190px] shrink-0 text-right text-[12px] text-muted-foreground">
                  {fmtLastSession(p.lastSessionAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-[12.5px] font-semibold text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
