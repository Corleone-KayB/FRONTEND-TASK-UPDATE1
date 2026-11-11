"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TimeOffDialog } from "@/components/therapist/TimeOffDialog";
import {
  useDeleteTherapistTimeOff,
  useTherapistAvailability,
  useTherapistTimeOff,
  useUpdateTherapistAvailability,
} from "@/hooks/useAppointments";
import { ApiError } from "@/lib/api";
import {
  buildWorkingHoursPayload,
  DAY_LABELS,
  findInvalidDay,
  groupWorkingHoursByDay,
  minutesToTimeString,
  timeStringToMinutes,
  type DayScheduleState,
} from "@/lib/availability";
import type { TherapistAvailability } from "@/types/domain";

function fmtRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${new Date(startsAt).toLocaleDateString(undefined, opts)} – ${new Date(
    endsAt
  ).toLocaleDateString(undefined, opts)}`;
}

interface DayRowProps {
  day: DayScheduleState;
  onToggle: (enabled: boolean) => void;
  onChangeStart: (minutes: number) => void;
  onChangeEnd: (minutes: number) => void;
  invalid: boolean;
}

function DayRow({ day, onToggle, onChangeStart, onChangeEnd, invalid }: DayRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
      <div className="flex w-[150px] shrink-0 items-center gap-3">
        <Checkbox checked={day.enabled} onCheckedChange={(v) => onToggle(v === true)} />
        <span className="text-[14px] font-semibold text-foreground">
          {DAY_LABELS[day.dayOfWeek]}
        </span>
      </div>

      {day.enabled ? (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            type="time"
            value={minutesToTimeString(day.startMinute)}
            onChange={(e) => onChangeStart(timeStringToMinutes(e.target.value))}
            className="w-[130px]"
            aria-label={`${DAY_LABELS[day.dayOfWeek]} start time`}
          />
          <span className="text-[13px] text-muted-foreground">to</span>
          <Input
            type="time"
            value={minutesToTimeString(day.endMinute)}
            onChange={(e) => onChangeEnd(timeStringToMinutes(e.target.value))}
            className="w-[130px]"
            aria-label={`${DAY_LABELS[day.dayOfWeek]} end time`}
          />
          {day.extraWindows.length > 0 && (
            <span
              className="text-[11.5px] text-muted-foreground"
              title="This day has additional windows set from another source - they're kept as-is on save."
            >
              +{day.extraWindows.length} more block{day.extraWindows.length > 1 ? "s" : ""} kept
            </span>
          )}
          {invalid && (
            <span className="text-[11.5px] font-semibold text-red-700">
              End time must be after start time.
            </span>
          )}
        </div>
      ) : (
        <p className="flex-1 text-[13px] text-muted-foreground">Unavailable</p>
      )}
    </div>
  );
}

interface AvailabilityEditorProps {
  availability: TherapistAvailability;
}

function AvailabilityEditor({ availability }: AvailabilityEditorProps) {
  const [days, setDays] = useState<DayScheduleState[]>(() =>
    groupWorkingHoursByDay(availability.workingHours)
  );
  const [timezone] = useState(availability.timezone || "Africa/Kigali");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addTimeOffOpen, setAddTimeOffOpen] = useState(false);

  const updateMutation = useUpdateTherapistAvailability();
  const {
    data: timeOffData,
    isLoading: timeOffLoading,
    isError: timeOffErrored,
  } = useTherapistTimeOff();
  const deleteMutation = useDeleteTherapistTimeOff();

  const invalidDay = findInvalidDay(days);

  function updateDay(dayOfWeek: number, patch: Partial<DayScheduleState>) {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  async function handleSave() {
    setValidationError(null);
    const invalid = findInvalidDay(days);
    if (invalid) {
      setValidationError(`${DAY_LABELS[invalid.dayOfWeek]}: end time must be after start time.`);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        timezone,
        workingHours: buildWorkingHoursPayload(days),
      });
    } catch {
      // Surfaced below via updateMutation.isError/mutation.error.
    }
  }

  const fieldErrors =
    updateMutation.error instanceof ApiError ? updateMutation.error.fieldErrors : undefined;

  const timeOff = timeOffData?.timeOff ?? [];

  return (
    <>
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Working hours</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Times are in {timezone}. Toggle a day on and set when you&apos;re available.
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {(validationError || (updateMutation.isError && !fieldErrors)) && (
          <div className="mb-3 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
            {validationError ?? updateMutation.error?.message ?? "Could not save your changes."}
          </div>
        )}
        {fieldErrors && (
          <div className="mb-3 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
            {Object.values(fieldErrors).flat().join(" ")}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border">
          {days.map((day) => (
            <DayRow
              key={day.dayOfWeek}
              day={day}
              invalid={invalidDay?.dayOfWeek === day.dayOfWeek}
              onToggle={(enabled) => updateDay(day.dayOfWeek, { enabled })}
              onChangeStart={(startMinute) => updateDay(day.dayOfWeek, { startMinute })}
              onChangeEnd={(endMinute) => updateDay(day.dayOfWeek, { endMinute })}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-bold text-foreground">Time off</h2>
          <Button variant="outline" size="sm" onClick={() => setAddTimeOffOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add time off
          </Button>
        </div>

        {timeOffErrored && (
          <div className="mb-3 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
            Could not load your time off.
          </div>
        )}

        {timeOffLoading ? (
          <p className="py-5 text-[13.5px] text-muted-foreground">Loading time off…</p>
        ) : timeOff.length === 0 ? (
          <p className="py-5 text-[13.5px] text-muted-foreground">
            No upcoming time off scheduled.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            {timeOff.map((block) => (
              <div
                key={block.id}
                className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-foreground">
                    {fmtRange(block.startsAt, block.endsAt)}
                  </p>
                  {block.reason && (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{block.reason}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(block.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TimeOffDialog open={addTimeOffOpen} onOpenChange={setAddTimeOffOpen} />
    </>
  );
}

export default function TherapistAvailabilityPage() {
  const { data, isLoading, isError } = useTherapistAvailability();

  return (
    <div className="min-h-full bg-white px-6 py-8 lg:px-10 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Availability</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Set your weekly working hours and block off time off.
        </p>
      </div>

      {isError && (
        <div className="mb-4 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] font-semibold text-red-700">
          Could not load your availability.
        </div>
      )}

      {isLoading ? (
        <p className="py-5 text-[13.5px] text-muted-foreground">Loading your availability…</p>
      ) : data ? (
        <AvailabilityEditor availability={data} />
      ) : null}
    </div>
  );
}
