"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDetailedAnalytics } from "@/hooks/useAdmin";
import {
  computeDateRangePreset,
  fillDailySeries,
  type AnalyticsRangePreset,
} from "@/lib/analytics-date-range";
import { cn } from "@/lib/utils";
import type {
  AnalyticsSessionTrendPoint,
  AnalyticsTrendPoint,
  AppointmentAnalytics,
  TherapistAnalytics,
  UserAnalytics,
} from "@/types/domain";

// --- Chart palette (dataviz skill, references/palette.md - the validated
// default instance) ---
// This admin area has no dark-mode toggle anywhere yet (no `dark:` class exists
// under src/app/admin), matching every other admin page's hardcoded light hexes,
// so these stay plain constants instead of the CSS-variable roles the skill
// recommends for a page that supports both themes.
const CHART_SURFACE = "#fcfcfb";
const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

// Single-hue accent for one-series charts (trend lines, plain magnitude-by-
// category bars) - slot 7 ("violet", #4a3aa7) of the skill's validated default
// categorical palette, chosen because it's the closest documented hex to
// Mindora's brand purple (--color-primary, #7c3aed). Per the skill: "Sequential
// is the safe default... reach for it unless the data's job is specifically
// identity or polarity" - a single bar/line series is a magnitude job, not an
// identity job, so it gets one hue, not a rainbow.
const ACCENT = "#4a3aa7";
const ACCENT_WASH = "rgba(74,58,167,0.07)";

// The skill's documented 8-hue categorical order, used unmodified - reordering
// it requires re-validating CVD adjacency from scratch, and the first N slots of
// this exact order are already proven pairwise-safe (worst adjacent CVD delta E
// 9.1 light). Only used where >=2 series must be told apart on the SAME chart
// (sessionTrend below); every single-series chart on this page uses ACCENT
// instead so a rainbow bar never appears where there's only one thing to compare.
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

const PRESETS: { key: AnalyticsRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatAxisDate(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// --- Shared chart chrome ---

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] bg-white p-5 shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff] lg:p-6">
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyChartNote({ note }: { note: string }) {
  return <p className="py-10 text-center text-[12.5px] text-muted-foreground">{note}</p>;
}

// Values lead, labels follow; a line key (not a box) keys each row; text stays
// on text tokens - only the swatch carries the series color.
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; name?: string; color?: string; dataKey?: string | number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-[4px_4px_14px_rgba(60,50,90,0.22)] ring-1 ring-black/5">
      {label && (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          {formatAxisDate(label)}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-[2px] w-3 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-semibold text-foreground">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </span>
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Legend always present for >=2 series - recharts' built-in legend colors the
// label text with the series color, which the skill forbids ("text never wears
// the data color"); this keeps the swatch colored and the label on a text token.
function ChartLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {payload.map((entry) => (
        <div
          key={entry.value}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
        >
          <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "critical";
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[8px_8px_18px_#cbc4de,-8px_-8px_18px_#fdfbff]">
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-[24px] font-bold tracking-tight",
          tone === "success" && "text-mindora-success",
          tone === "critical" && "text-red-600",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">{children}</div>
  );
}

function StatSkeleton({ count }: { count: number }) {
  return (
    <StatGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-white/60" />
      ))}
    </StatGrid>
  );
}

function SectionUnavailable({ label }: { label: string }) {
  return (
    <div className="rounded-[26px] bg-white p-8 text-center shadow-[10px_10px_22px_#cbc4de,-10px_-10px_22px_#fdfbff]">
      <p className="text-[14px] font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        This data is temporarily unavailable - the underlying service couldn&apos;t be reached.
      </p>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// --- Sections ---

function UserAnalyticsSection({
  data,
  from,
  to,
}: {
  data: UserAnalytics | null;
  from: string;
  to: string;
}) {
  const trend = useMemo<AnalyticsTrendPoint[]>(
    () => (data ? fillDailySeries(data.registrationTrend, from, to, { count: 0 }) : []),
    [data, from, to]
  );

  const roleData = useMemo(
    () =>
      data
        ? (Object.entries(data.usersByRole) as [string, number][]).map(([role, count]) => ({
            role: titleCase(role),
            count,
          }))
        : [],
    [data]
  );

  if (!data) return <SectionUnavailable label="User analytics" />;

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <StatTile label="Total users" value={data.totalUsers.toLocaleString()} />
        <StatTile label="New users in range" value={data.newUsersInRange.toLocaleString()} />
        <StatTile label="Daily active (DAU)" value={data.dau.toLocaleString()} />
        <StatTile label="Weekly active (WAU)" value={data.wau.toLocaleString()} />
        <StatTile label="Monthly active (MAU)" value={data.mau.toLocaleString()} />
        <StatTile
          label="Suspended users"
          value={data.suspendedUsers.toLocaleString()}
          tone={data.suspendedUsers > 0 ? "critical" : "default"}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Registrations over time" subtitle="New user sign-ups per day">
          {trend.length === 0 ? (
            <EmptyChartNote note="No registrations in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: BASELINE, strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="New registrations"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT, stroke: CHART_SURFACE, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Users by role" subtitle="Current role distribution">
          {roleData.length === 0 ? (
            <EmptyChartNote note="No users to break down yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={roleData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={GRIDLINE} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="role"
                  tick={{ fontSize: 12, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT_WASH }} />
                <Bar
                  dataKey="count"
                  name="Users"
                  fill={ACCENT}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function TherapistAnalyticsSection({
  data,
  from,
  to,
}: {
  data: TherapistAnalytics | null;
  from: string;
  to: string;
}) {
  const trend = useMemo<AnalyticsTrendPoint[]>(
    () => (data ? fillDailySeries(data.applications.applicationTrend, from, to, { count: 0 }) : []),
    [data, from, to]
  );

  const statusData = useMemo(
    () =>
      data
        ? (Object.entries(data.applications.byStatus) as [string, number][]).map(
            ([status, count]) => ({
              status: titleCase(status).replace(/_/g, " "),
              count,
            })
          )
        : [],
    [data]
  );

  if (!data) return <SectionUnavailable label="Therapist analytics" />;

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <StatTile label="Total therapists" value={data.totalTherapists.toLocaleString()} />
        <StatTile
          label="Suspended therapists"
          value={data.suspendedTherapists.toLocaleString()}
          tone={data.suspendedTherapists > 0 ? "critical" : "default"}
        />
        <StatTile
          label="Approval rate"
          value={formatPercent(data.applications.approvalRate)}
          tone="success"
        />
        <StatTile
          label="Rejection rate"
          value={formatPercent(data.applications.rejectionRate)}
          tone={data.applications.rejectionRate > 0 ? "critical" : "default"}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Applications by status"
          subtitle="Where applications sit in the review pipeline"
        >
          {statusData.length === 0 ? (
            <EmptyChartNote note="No applications in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, statusData.length * 42)}>
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={GRIDLINE} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT_WASH }} />
                <Bar
                  dataKey="count"
                  name="Applications"
                  fill={ACCENT}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Applications over time" subtitle="New/updated applications per day">
          {trend.length === 0 ? (
            <EmptyChartNote note="No application activity in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: BASELINE, strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Applications"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT, stroke: CHART_SURFACE, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function AppointmentAnalyticsSection({
  data,
  from,
  to,
}: {
  data: AppointmentAnalytics | null;
  from: string;
  to: string;
}) {
  const trend = useMemo<AnalyticsSessionTrendPoint[]>(
    () =>
      data
        ? fillDailySeries(data.sessionTrend, from, to, {
            completed: 0,
            cancelled: 0,
            pending: 0,
            confirmed: 0,
          })
        : [],
    [data, from, to]
  );

  const statusData = useMemo(
    () =>
      data
        ? (Object.entries(data.statusBreakdown) as [string, number][]).map(([status, count]) => ({
            status: titleCase(status),
            count,
          }))
        : [],
    [data]
  );

  if (!data) return <SectionUnavailable label="Appointment analytics" />;

  return (
    <div className="flex flex-col gap-4">
      <StatGrid>
        <StatTile label="Total appointments" value={data.totalAppointments.toLocaleString()} />
        <StatTile
          label="Completed appointments"
          value={data.completedAppointments.toLocaleString()}
        />
        <StatTile
          label="Completion rate"
          value={formatPercent(data.completionRate)}
          tone="success"
        />
        <StatTile
          label="Cancellation rate"
          value={formatPercent(data.cancellationRate)}
          tone={data.cancellationRate > 0 ? "critical" : "default"}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Appointments by status" subtitle="Current status breakdown">
          {statusData.length === 0 ? (
            <EmptyChartNote note="No appointments in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={GRIDLINE} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 12, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT_WASH }} />
                <Bar
                  dataKey="count"
                  name="Appointments"
                  fill={ACCENT}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Sessions over time" subtitle="Daily session outcomes, by status">
          {trend.length === 0 ? (
            <EmptyChartNote note="No session activity in this range." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRIDLINE} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={{ stroke: BASELINE }}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: BASELINE, strokeWidth: 1 }} />
                <Legend content={<ChartLegend />} />
                <Line
                  type="monotone"
                  dataKey="confirmed"
                  name="Confirmed"
                  stroke={CATEGORICAL[0]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending"
                  stroke={CATEGORICAL[1]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke={CATEGORICAL[2]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  name="Cancelled"
                  stroke={CATEGORICAL[3]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// --- Page ---

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<AnalyticsRangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedCustom, setAppliedCustom] = useState<{ from: string; to: string } | null>(null);

  const range = useMemo(() => {
    if (preset === "custom") {
      // Both optional - if the admin hasn't applied a custom range yet, the
      // server falls back to its own last-30-days default, same as omitting
      // the params entirely.
      return appliedCustom ?? { from: undefined, to: undefined };
    }
    return computeDateRangePreset(preset, new Date());
  }, [preset, appliedCustom]);

  const { data, isLoading, isError } = useDetailedAnalytics(range);

  // Trend charts need concrete from/to boundaries to zero-fill against - fall
  // back to the server-reported range (always present once data loads) so a
  // "custom, not yet applied" or omitted-params request still fills correctly.
  const effectiveFrom = range.from ?? data?.range.from ?? new Date(0).toISOString();
  const effectiveTo = range.to ?? data?.range.to ?? new Date().toISOString();

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    setAppliedCustom({
      from: new Date(`${customFrom}T00:00:00.000Z`).toISOString(),
      to: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
    });
  }

  return (
    <div className="min-h-full bg-[#eae6f4] px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Detailed platform trends across users, therapist applications, and appointments.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            className={cn(
              "rounded-full px-4 py-2 text-[12.5px] font-semibold transition-shadow",
              preset === p.key
                ? "bg-mindora-purple text-white shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff]"
                : "text-muted-foreground shadow-[3px_3px_7px_#cdc6e0,-3px_-3px_7px_#fdfbff] hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white/60 p-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-11 w-[160px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-11 w-[160px]"
            />
          </div>
          <Button
            type="button"
            size="default"
            onClick={applyCustomRange}
            disabled={!customFrom || !customTo}
          >
            Apply
          </Button>
          {!appliedCustom && (
            <p className="pb-2.5 text-[12px] text-muted-foreground">
              Pick both dates and apply - showing the last 30 days until then.
            </p>
          )}
        </div>
      )}

      {isError && (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 shadow-[inset_3px_3px_7px_#f3d9d9,inset_-3px_-3px_7px_#ffffff]">
          Could not load analytics for this range.
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-10">
          <StatSkeleton count={6} />
          <StatSkeleton count={4} />
          <StatSkeleton count={4} />
        </div>
      ) : (
        !isError && (
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <SectionHeading title="User analytics" subtitle="Growth, engagement, and role mix" />
              <UserAnalyticsSection
                data={data?.users ?? null}
                from={effectiveFrom}
                to={effectiveTo}
              />
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeading
                title="Therapist analytics"
                subtitle="Applications moving through the review pipeline"
              />
              <TherapistAnalyticsSection
                data={data?.therapists ?? null}
                from={effectiveFrom}
                to={effectiveTo}
              />
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeading
                title="Appointment analytics"
                subtitle="Session volume and outcomes"
              />
              <AppointmentAnalyticsSection
                data={data?.appointments ?? null}
                from={effectiveFrom}
                to={effectiveTo}
              />
            </section>
          </div>
        )
      )}
    </div>
  );
}
