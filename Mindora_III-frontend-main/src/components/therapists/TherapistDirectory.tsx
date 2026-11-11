"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TherapistCard } from "@/components/therapists/TherapistCard";
import {
  SPECIALISATION_OPTIONS,
  THERAPISTS,
  matchesSpecialisation,
} from "@/lib/mock-data/therapists";
import { Button } from "@/components/ui/button";

type SortKey = "rating" | "price" | "sessions";

export function TherapistDirectory() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [availability, setAvailability] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const specialisation = searchParams.get("specialisation") ?? "";
  const [duration, setDuration] = useState("all");
  const [gender, setGender] = useState("all");

  function toggleAvailability(value: string) {
    setAvailability((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function clearFilters() {
    setAvailability([]);
    setDate("");
    setDuration("all");
    setGender("all");
    setQuery("");
    router.replace("/therapists");
  }

  const therapists = useMemo(() => {
    let list = THERAPISTS.filter((therapist) => {
      const haystack = `${therapist.name} ${therapist.title}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (!matchesSpecialisation(therapist.specialisations, specialisation || null)) return false;
      if (availability.includes("Today") && !therapist.availableToday) return false;
      if (availability.includes("This Week") && !therapist.availableThisWeek) return false;
      if (availability.includes("Online") && !therapist.online) return false;
      if (gender !== "all" && therapist.gender !== gender) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "price") return (a.price60 ?? Infinity) - (b.price60 ?? Infinity);
      if (sort === "sessions")
        return parseInt(b.sessions ?? "0", 10) - parseInt(a.sessions ?? "0", 10);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return list;
  }, [availability, gender, query, sort, specialisation]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-mindora-purple">Filters</h2>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Availability</h3>
          <div className="mt-3 space-y-3">
            {["Today", "This Week", "Online"].map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={availability.includes(option)}
                  onCheckedChange={() => toggleAvailability(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Specific date or range</h3>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-3 h-11"
          />
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Areas of interest</h3>
          <Select
            value={specialisation || "all"}
            onValueChange={(value) => {
              const next = value === "all" ? "" : value;
              const params = new URLSearchParams(searchParams.toString());
              if (next) params.set("specialisation", next);
              else params.delete("specialisation");
              router.replace(params.toString() ? `/therapists?${params}` : "/therapists");
            }}
          >
            <SelectTrigger className="mt-3 h-11">
              <SelectValue placeholder="Select Specialisation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select Specialisation</SelectItem>
              {SPECIALISATION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Duration</h3>
          <RadioGroup value={duration} onValueChange={setDuration} className="mt-3">
            {[
              ["all", "All"],
              ["30", "30 Min"],
              ["60", "60 Min"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={value} id={`duration-${value}`} />
                <Label htmlFor={`duration-${value}`}>{label}</Label>
              </label>
            ))}
          </RadioGroup>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Therapist Gender</h3>
          <RadioGroup value={gender} onValueChange={setGender} className="mt-3">
            {[
              ["all", "All"],
              ["male", "Male"],
              ["female", "Female"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={value} id={`gender-${value}`} />
                <Label htmlFor={`gender-${value}`}>{label}</Label>
              </label>
            ))}
          </RadioGroup>
        </section>

        <button
          type="button"
          onClick={clearFilters}
          className="mt-6 text-sm font-medium text-mindora-purple hover:underline"
        >
          Clear filters
        </button>
      </aside>

      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Therapist Name or Title"
              className="h-11 pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="h-11 w-full sm:w-52">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="price">Price (low to high)</SelectItem>
              <SelectItem value="sessions">Sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {therapists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-[#F9F6FF] p-10 text-center">
            <p className="font-semibold">No therapists match these filters</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Try clearing a filter or searching another name.
            </p>
            <Button className="mt-4" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {therapists.map((therapist) => (
              <TherapistCard key={therapist.id} therapist={therapist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
