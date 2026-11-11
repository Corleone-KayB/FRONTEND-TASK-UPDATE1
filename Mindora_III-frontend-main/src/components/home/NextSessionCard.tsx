"use client";

import Link from "next/link";
import type { BookedAppointment, SessionType } from "@/types/domain";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function relativeDayLabel(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfDay(target).getTime() - startOfDay(now).getTime()) / 86_400_000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return "Yesterday";
  return `${Math.abs(diffDays)} days ago`;
}

function sessionLine(iso: string, sessionType: SessionType): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart} · ${sessionType === "VIDEO" ? "Video" : "Audio"}`;
}

interface NextSessionCardProps {
  appointment: BookedAppointment | null;
  therapistName: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function NextSessionCard({
  appointment,
  therapistName,
  isLoading,
  isError,
}: NextSessionCardProps) {
  if (isLoading) {
    return (
      <div className="h-full min-h-[150px] animate-pulse rounded-[30px] bg-white/60 shadow-[10px_10px_24px_#c6bfda,-10px_-10px_24px_#fdfbff]" />
    );
  }

  // A failed fetch must never look like "no upcoming sessions" - that reads as
  // "you have nothing booked" when the truth is just "we couldn't check."
  if (isError) {
    return (
      <div className="flex h-full flex-col justify-between gap-4 rounded-[30px] bg-white p-6 shadow-[10px_10px_24px_#c6bfda,-10px_-10px_24px_#fdfbff]">
        <span className="text-[10.5px] font-bold tracking-wide text-[#8f87a4]">NEXT SESSION</span>
        <p className="text-[13.5px] text-muted-foreground">
          Could not load your sessions right now - this doesn&apos;t mean you have none booked. Try
          refreshing.
        </p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex h-full flex-col justify-between gap-4 rounded-[30px] bg-white p-6 shadow-[10px_10px_24px_#c6bfda,-10px_-10px_24px_#fdfbff]">
        <span className="text-[10.5px] font-bold tracking-wide text-[#8f87a4]">NEXT SESSION</span>
        <div>
          <p className="text-[14.5px] font-semibold text-foreground">No upcoming sessions</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Book a session with a therapist to see it here.
          </p>
        </div>
        <Link href="/therapy" className="text-[13px] font-bold text-mindora-purple hover:underline">
          Browse therapists
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-[30px] bg-[#211d2c] p-6 text-white shadow-[10px_10px_24px_#c6bfda,-10px_-10px_24px_#fdfbff]">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold tracking-wide text-[#a29ab6]">NEXT SESSION</span>
        <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold text-[#c4b5fd] shadow-[inset_3px_3px_7px_#16131e,inset_-3px_-3px_7px_#2c273a]">
          {relativeDayLabel(appointment.slotStart)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#251f33] text-[14px] font-bold text-[#c4b5fd] shadow-[4px_4px_10px_#17131f,-4px_-4px_10px_#2b2638]">
          {initialsFor(therapistName)}
        </div>
        <div>
          <p className="text-[15.5px] font-bold">{therapistName}</p>
          <p className="text-[12.5px] text-[#a29ab6]">
            {sessionLine(appointment.slotStart, appointment.sessionType)}
          </p>
        </div>
      </div>
    </div>
  );
}
