"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTestById, testResultStorageKey, type TestDefinition } from "@/lib/mock-data/tests";
import { cn } from "@/lib/utils";

export function TestQuiz({ test }: { test: TestDefinition }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  const total = test.items.length;
  const current = test.items[index];
  const selected = answers[index];
  const progress = ((index + (selected !== undefined ? 1 : 0)) / total) * 100;
  const isLast = index === total - 1;

  const options = useMemo(() => test.answers, [test.answers]);

  function goNext() {
    if (selected === undefined) {
      setError("Please select an answer to continue");
      return;
    }
    setError("");
    if (isLast) {
      window.sessionStorage.setItem(testResultStorageKey(test.id), JSON.stringify(answers));
      router.push(`/tests/${test.id}/result`);
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (index === 0 ? router.push("/tests") : setIndex((value) => value - 1))}
          className="rounded-full p-2 text-[#1A1A1A] hover:bg-[#F9F6FF]"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <MindoraLogo href="/" size="sm" showTagline={false} />
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-[#6B7280]">
          Question {index + 1} of {total}
        </p>
        <Progress value={Math.max(progress, ((index + 1) / total) * 100)} className="mt-2" />
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-[#FFFBEB] px-4 py-3 text-sm text-amber-800">
        This is a screening tool only. It does not replace professional diagnosis.
      </div>

      <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-mindora-purple">
        Question {index + 1}
      </p>
      <p className="mt-2 text-sm text-[#6B7280]">{test.instructions}</p>
      <h1 className="mt-4 text-xl font-semibold leading-relaxed text-[#1A1A1A]">{current}</h1>

      <div className="mt-6 space-y-3">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setAnswers((currentAnswers) => ({ ...currentAnswers, [index]: option.value }));
                setError("");
              }}
              className={cn(
                "w-full rounded-xl border px-4 py-4 text-left text-sm font-medium transition-all",
                isSelected
                  ? "scale-[1.01] border-mindora-purple bg-mindora-purple text-white"
                  : "border-border bg-white text-[#1A1A1A] hover:border-mindora-purple/40"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (index === 0 ? router.push("/tests") : setIndex((value) => value - 1))}
        >
          Back
        </Button>
        <Button type="button" onClick={goNext}>
          {isLast ? "Submit" : "Next"}
        </Button>
      </div>
    </div>
  );
}

export function TestQuizGate({ id }: { id: string }) {
  const test = getTestById(id);
  if (!test) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-semibold">This test could not be found.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/tests">Back to tests</Link>
        </Button>
      </div>
    );
  }
  return <TestQuiz test={test} />;
}
