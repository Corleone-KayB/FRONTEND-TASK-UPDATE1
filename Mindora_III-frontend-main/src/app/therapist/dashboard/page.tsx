"use client";

import Link from "next/link";
import { CalendarClock, CalendarX, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTherapistDashboard } from "@/hooks/useAppointments";
import type { BookedAppointment } from "@/types/domain";

const STATUS_VARIANT = {
  PENDING: "pending",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
} as const;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatSessionType(type: BookedAppointment["sessionType"]): string {
  return type === "VIDEO" ? "Video call" : "Audio call";
}

function patientLabel(patientId: string): string {
  return `Patient ${patientId.slice(0, 8)}`;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border px-5 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mindora-purple-pale text-mindora-purple">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[22px] font-bold leading-tight text-foreground">{value}</p>
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border px-5 py-4">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-black/10" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-10 animate-pulse rounded bg-black/10" />
        <div className="h-3 w-20 animate-pulse rounded bg-black/10" />
      </div>
    </div>
  );
}

export default function TherapistDashboardPage() {
  const { data, isLoading, isError } = useTherapistDashboard();

  const sessions = [...(data?.todaysSessions ?? [])].sort(
    (a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );

  return (
    <div className="min-h-full bg-white px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">Your practice at a glance.</p>
      </div>

      {isError && (
        <div className="mb-4 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
          Could not load your dashboard right now - this doesn&apos;t mean anything has changed,
          just that we couldn&apos;t check.
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Pending requests"
              value={data?.pendingCount ?? 0}
              icon={ClipboardList}
            />
            <StatCard
              label="Upcoming sessions"
              value={data?.upcomingCount ?? 0}
              icon={CalendarClock}
            />
            <StatCard label="Patients" value={data?.patientCount ?? 0} icon={Users} />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-[16px] font-bold text-foreground">Today&apos;s sessions</h2>

        {isLoading ? (
          <p className="py-5 text-[13.5px] text-muted-foreground">Loading today&apos;s sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-mindora-lavender text-mindora-purple-light">
              <CalendarX className="h-6 w-6" />
            </div>
            <p className="mb-1 text-[15px] font-bold text-foreground">No sessions today</p>
            <p className="text-[13.5px] text-muted-foreground">
              Nothing confirmed for today yet.{" "}
              <Link href="/therapist" className="font-semibold text-mindora-purple hover:underline">
                View your full schedule
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            {sessions.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold text-foreground">
                    {fmtTime(apt.slotStart)} · {patientLabel(apt.patientId)}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {formatSessionType(apt.sessionType)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[apt.status]} className="shrink-0">
                  {apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
