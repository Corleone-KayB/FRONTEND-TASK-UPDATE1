"use client";

import { usePlatformAnalytics } from "@/hooks/useAdmin";

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[8px_8px_18px_#cbc4de,-8px_-8px_18px_#fdfbff]">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-[26px] font-bold tracking-tight text-foreground">
        {value === null ? (
          <span className="text-[16px] font-medium text-muted-foreground">Unavailable</span>
        ) : (
          value.toLocaleString()
        )}
      </p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading, isError } = usePlatformAnalytics();

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Platform overview</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Aggregated across every service - a field reads &ldquo;Unavailable&rdquo; only if that
          specific service couldn&apos;t be reached.
        </p>
      </div>

      {isError && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load platform analytics.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCard label="Total users" value={data?.totalUsers ?? null} />
          <StatCard label="Active users (30d)" value={data?.activeUsersLast30Days ?? null} />
          <StatCard label="Total appointments" value={data?.totalAppointments ?? null} />
          <StatCard label="Completed appointments" value={data?.completedAppointments ?? null} />
          <StatCard label="Total mood entries" value={data?.totalMoodEntries ?? null} />
          <StatCard label="Avg mood score" value={data?.avgMoodScorePlatform ?? null} />
          <StatCard label="Total community posts" value={data?.totalCommunityPosts ?? null} />
          <StatCard label="Total AI interactions" value={data?.totalAiInteractions ?? null} />
          <StatCard label="Total crisis events" value={data?.totalCrisisEvents ?? null} />
        </div>
      )}
    </div>
  );
}
