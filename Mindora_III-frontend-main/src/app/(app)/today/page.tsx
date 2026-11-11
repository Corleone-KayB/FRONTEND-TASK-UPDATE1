"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { HomeHeroPortrait } from "@/components/home/HomeSections";
import { WeeklyMoodCard } from "@/components/home/WeeklyMoodCard";
import { NextSessionCard } from "@/components/home/NextSessionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useMoodStreak } from "@/hooks/useMood";
import { useMyAppointments } from "@/hooks/useAppointments";
import { useTherapists } from "@/hooks/useTherapists";
import { selectNextSession } from "@/lib/appointments";
import type { TherapistProfile } from "@/types/domain";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export default function TodayPage() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: streak, isLoading: streakLoading, isError: streakErrored } = useMoodStreak();
  const {
    data: appointmentData,
    isLoading: appointmentsLoading,
    isError: appointmentsErrored,
  } = useMyAppointments();
  const { data: therapistData } = useTherapists({});

  const displayName = profile?.profile?.userName ?? user?.email ?? "there";
  const firstName = displayName.split(" ")[0];

  const therapistByUserId = useMemo(() => {
    const map = new Map<string, TherapistProfile>();
    (therapistData?.therapists ?? []).forEach((t) => map.set(t.userId, t));
    return map;
  }, [therapistData]);

  function therapistNameFor(therapistId: string): string {
    return therapistByUserId.get(therapistId)?.userName ?? "Therapist";
  }

  // Read once on mount rather than inside the memo below: React's purity
  // rules forbid calling Date.now() during render (it can run more than once
  // per commit under Strict Mode / the compiler), so the "now" a memo uses
  // must come from state, not a direct call. A snapshot from mount is exactly
  // as fresh as this page needs - see the comment on the memo below.
  const [now] = useState(() => Date.now());

  // Only recomputes when the appointment list actually changes (matching the
  // `now` snapshot above), not every render - so a session that quietly slips
  // into the past while the tab sits open keeps showing as "next" until the
  // next appointments refetch. Acceptable here: react-query already refetches
  // this list periodically, and a stale-by-a-few-minutes "next session" card
  // is a cosmetic gap, not a booking-correctness one.
  const nextSession = useMemo(
    () => selectNextSession(appointmentData?.appointments ?? [], now),
    [appointmentData, now]
  );

  // Never collapse "couldn't fetch" into "0 days" - in a check-in-streak app,
  // that reads as "you lost your streak" when the truth is just a failed
  // request. Loading and error each get their own honest state instead.
  const streakLabel = streak ? (streak.streak === 1 ? "1 day" : `${streak.streak} days`) : null;

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-11 lg:py-9">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-3.5 inline-flex items-center gap-2.5 rounded-full px-4 py-2 shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]">
            <span className="text-[12px] font-bold uppercase tracking-wide text-mindora-purple">
              {getFormattedDate()}
            </span>
          </div>
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-tight text-foreground lg:text-[42px]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-[#6a6383]">
            You&apos;re doing beautifully. A gentle check-in today keeps your streak alive.
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5 shadow-[7px_7px_16px_#cdc6e0,-7px_-7px_16px_#fdfbff]">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-full shadow-[inset_3px_3px_7px_#cdc6e0,inset_-3px_-3px_7px_#fdfbff]">
              <Flame className="h-4 w-4 text-[#c67139]" />
            </span>
            <div className="leading-tight">
              <div className="text-[10px] font-bold tracking-wide text-[#8f87a4]">STREAK</div>
              <div className="text-[15px] font-bold text-foreground">
                {streakLoading ? (
                  <span className="inline-block h-4 w-12 animate-pulse rounded-full bg-black/10" />
                ) : streakErrored ? (
                  <span
                    className="text-[12.5px] font-semibold text-muted-foreground"
                    title="Could not load your streak right now - this doesn't mean it's gone."
                  >
                    Unavailable
                  </span>
                ) : (
                  streakLabel
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
        <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[34px] bg-gradient-to-br from-[#efeafa] via-[#e6dff6] to-[#ded4f4] shadow-[12px_12px_26px_#cbc4de,-12px_-12px_26px_#fdfbff]">
          <div className="pointer-events-none absolute -right-24 -top-28 h-[360px] w-[360px] rounded-full bg-[#e8e1f8] shadow-[inset_10px_10px_24px_#d2c9ea,inset_-10px_-10px_24px_#fdfbff]" />
          <div className="relative grid flex-1 grid-cols-1 items-end gap-5 p-9 pb-0 sm:grid-cols-2">
            <div className="flex flex-col justify-center pb-9">
              <span className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[11.5px] font-bold tracking-wide text-[#5b21b6] shadow-[inset_3px_3px_7px_#d3caeb,inset_-3px_-3px_7px_#fdfbff]">
                <span className="h-[7px] w-[7px] rounded-full bg-mindora-purple" />
                DAILY CHECK-IN
              </span>
              <h2 className="mt-4.5 text-[28px] font-extrabold leading-tight tracking-tight text-[#2c1c55] lg:text-[30px]">
                How are you feeling today?
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[#5d4d85]">
                Two minutes to check in with yourself. It matters.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/check-in"
                  className="flex h-14 items-center gap-2.5 rounded-full bg-mindora-purple px-6.5 text-[15px] font-bold text-white shadow-[8px_8px_18px_#c6bade,-8px_-8px_18px_#fdfbff] hover:bg-mindora-purple-dark"
                >
                  Log today&apos;s mood
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <span className="text-[13px] font-semibold text-[#6b5a92]">≈ 2 min</span>
              </div>
            </div>
            <div className="relative h-[320px] w-full max-w-[300px] self-end justify-self-end overflow-hidden rounded-t-[34px]">
              <HomeHeroPortrait />
            </div>
          </div>
        </div>

        <WeeklyMoodCard />
      </section>

      <section className="mt-6 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(272px,1fr))]">
        <NextSessionCard
          appointment={nextSession}
          therapistName={nextSession ? therapistNameFor(nextSession.therapistId) : ""}
          isLoading={appointmentsLoading}
          isError={appointmentsErrored}
        />
      </section>
    </div>
  );
}
