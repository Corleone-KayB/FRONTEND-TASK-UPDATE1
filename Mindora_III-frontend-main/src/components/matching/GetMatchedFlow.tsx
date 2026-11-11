"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  CalendarDays,
  Frown,
  Heart,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Video,
  Wind,
  Baby,
  Flame,
  Moon,
  Apple,
  CircleDot,
  ShieldAlert,
  Briefcase,
  Compass,
} from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TherapistCard } from "@/components/therapists/TherapistCard";
import { MATCH_REASONS } from "@/lib/mock-data/public";
import { THERAPISTS, matchesSpecialisation } from "@/lib/mock-data/therapists";
import { cn } from "@/lib/utils";

const reasonIcons = [
  Frown,
  Wind,
  Flame,
  Users,
  Baby,
  Sparkles,
  ShieldAlert,
  Heart,
  Moon,
  CircleDot,
  Briefcase,
  Compass,
  User,
  Apple,
];

const genderOptions = [
  { value: "none", label: "No preference", icon: Users },
  { value: "male", label: "Male", icon: User },
  { value: "female", label: "Female", icon: User },
];

const sessionOptions = [
  { value: "video", label: "Video", icon: Video },
  { value: "audio", label: "Audio", icon: AudioLines },
  { value: "chat", label: "Chat", icon: MessageSquare },
];

const reasonToSpecialisation: Record<string, string> = {
  depression: "Depression",
  anxiety: "Anxiety",
  addiction: "Addiction",
  couple: "Couple therapy",
  trauma: "PTSD",
  burnout: "Stress",
  eating: "Eating disorder",
  anger: "Mood disorder",
  sleep: "Stress",
  child: "Mood disorder",
};

export function GetMatchedFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [reasons, setReasons] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [availability, setAvailability] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});

  const firstReason = MATCH_REASONS.find((item) => item.id === reasons[0]);
  const matched = useMemo(() => {
    const spec = reasonToSpecialisation[reasons[0]] ?? firstReason?.label;
    const filtered = THERAPISTS.filter((therapist) => {
      if (gender === "male" || gender === "female") return therapist.gender === gender;
      return true;
    }).filter((therapist) => matchesSpecialisation(therapist.specialisations, spec));
    const list = filtered.length >= 3 ? filtered : THERAPISTS;
    return list.slice(0, 3);
  }, [firstReason?.label, gender, reasons]);

  function toggleReason(id: string) {
    setReasons((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    setErrors((current) => ({ ...current, 1: "" }));
  }

  function next() {
    if (step === 1 && reasons.length === 0) {
      setErrors((current) => ({ ...current, 1: "Please select at least one reason to continue" }));
      return;
    }
    if (step === 2 && !gender) {
      setErrors((current) => ({ ...current, 2: "Please choose a preference" }));
      return;
    }
    if (step === 3 && !sessionType) {
      setErrors((current) => ({ ...current, 3: "Please choose how you would like to connect" }));
      return;
    }
    if (step === 4 && !availability) {
      setErrors((current) => ({ ...current, 4: "Please choose your availability" }));
      return;
    }
    if (step === 4 && availability === "specific" && !specificDate) {
      setErrors((current) => ({ ...current, 4: "Please select a date" }));
      return;
    }
    setStep((value) => Math.min(5, value + 1));
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((value) => value - 1) : router.push("/"))}
            className="rounded-full p-2 hover:bg-[#F9F6FF]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <MindoraLogo href="/" size="sm" showTagline={false} />
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-[#6B7280]">Step {step} of 5</p>
          <Progress value={(step / 5) * 100} className="mt-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-10"
          >
            {step === 1 ? (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Why are you coming here today?
                </h1>
                <p className="mt-2 text-[#6B7280]">Select all that apply</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {MATCH_REASONS.map((reason, index) => {
                    const Icon = reasonIcons[index];
                    const selected = reasons.includes(reason.id);
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => toggleReason(reason.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all",
                          selected
                            ? "scale-[1.01] border-mindora-purple bg-mindora-purple text-white"
                            : "border-border bg-white text-[#1A1A1A] hover:border-mindora-purple/40"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {reason.label}
                      </button>
                    );
                  })}
                </div>
                {errors[1] ? <p className="mt-4 text-sm text-red-600">{errors[1]}</p> : null}
                <div className="mt-8 flex justify-end">
                  <Button onClick={next} disabled={reasons.length === 0}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Do you have a preference for your therapist&apos;s gender?
                </h1>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {genderOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = gender === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setGender(option.value);
                          setErrors((current) => ({ ...current, 2: "" }));
                        }}
                        className={cn(
                          "flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border px-4 py-6 font-semibold transition-all",
                          selected
                            ? "scale-[1.01] border-mindora-purple bg-mindora-purple text-white"
                            : "border-border bg-white hover:border-mindora-purple/40"
                        )}
                      >
                        <Icon className="h-7 w-7" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors[2] ? <p className="mt-4 text-sm text-red-600">{errors[2]}</p> : null}
                <div className="mt-8 flex justify-end">
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  How would you like to connect with your therapist?
                </h1>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {sessionOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = sessionType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSessionType(option.value);
                          setErrors((current) => ({ ...current, 3: "" }));
                        }}
                        className={cn(
                          "flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border px-4 py-6 font-semibold transition-all",
                          selected
                            ? "scale-[1.01] border-mindora-purple bg-mindora-purple text-white"
                            : "border-border bg-white hover:border-mindora-purple/40"
                        )}
                      >
                        <Icon className="h-7 w-7" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors[3] ? <p className="mt-4 text-sm text-red-600">{errors[3]}</p> : null}
                <div className="mt-8 flex justify-end">
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">When are you available?</h1>
                <div className="mt-8 grid gap-4">
                  {[
                    {
                      value: "flexible",
                      label: "Flexible — I will work around the therapist's schedule",
                    },
                    {
                      value: "specific",
                      label: "Specific date — I have a particular date in mind",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAvailability(option.value);
                        setErrors((current) => ({ ...current, 4: "" }));
                      }}
                      className={cn(
                        "rounded-xl border px-5 py-5 text-left font-semibold transition-all",
                        availability === option.value
                          ? "border-mindora-purple bg-mindora-purple text-white"
                          : "border-border bg-white hover:border-mindora-purple/40"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
                {availability === "specific" ? (
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(event) => setSpecificDate(event.target.value)}
                    className="mt-4 max-w-xs"
                  />
                ) : null}
                {errors[4] ? <p className="mt-4 text-sm text-red-600">{errors[4]}</p> : null}
                <div className="mt-8 flex justify-end">
                  <Button onClick={next}>Next</Button>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <h1 className="text-3xl font-bold tracking-tight">We found therapists for you</h1>
                <p className="mt-2 text-[#6B7280]">
                  Therapists specialising in {firstReason?.label ?? "your selected needs"}
                </p>
                <div className="mt-8 space-y-4">
                  {matched.map((therapist) => (
                    <TherapistCard key={therapist.id} therapist={therapist} />
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
