"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getTestById, scoreTest, testResultStorageKey } from "@/lib/mock-data/tests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/public/BackLink";

const severityColor: Record<string, string> = {
  Normal: "bg-[#16A34A] text-white",
  Minimal: "bg-[#16A34A] text-white",
  Mild: "bg-[#D97706] text-white",
  Moderate: "bg-[#EA580C] text-white",
  Severe: "bg-[#DC2626] text-white",
  "Extremely Severe": "bg-[#991B1B] text-white",
  Subclinical: "bg-[#16A34A] text-white",
  Extreme: "bg-[#991B1B] text-white",
  "Not consistent": "bg-[#16A34A] text-white",
  Consistent: "bg-[#EA580C] text-white",
};

function subscribe() {
  return () => undefined;
}

function readResult(id: string) {
  return window.sessionStorage.getItem(testResultStorageKey(id));
}

export function TestResultView({ id }: { id: string }) {
  const test = getTestById(id);
  const raw = useSyncExternalStore(
    subscribe,
    () => (test ? readResult(id) : null),
    () => null
  );

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

  if (!raw) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-semibold">No answers found for this test.</p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Please take the test first to see your result.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/tests/${id}`}>Take test</Link>
        </Button>
      </div>
    );
  }

  const answers = JSON.parse(raw) as Record<number, number>;
  const result = scoreTest(test, answers);
  const scoreLabel =
    test.scoreKind === "asrs"
      ? `${result.displayScore} / 6 primary indicators`
      : `Score: ${result.displayScore} / ${result.maxScore}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <BackLink fallback="/tests" className="mb-2" />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{test.name}</h1>
      <p className="mt-6 text-4xl font-bold text-[#1A1A1A]">{scoreLabel}</p>
      <Badge className={`mt-4 ${severityColor[result.severity] ?? "bg-mindora-purple text-white"}`}>
        {result.severity}
      </Badge>
      <h2 className="mt-4 text-2xl font-bold">{result.label}</h2>
      {result.extras?.map((item) => (
        <p key={item.label} className="mt-2 text-sm text-[#6B7280]">
          {item.label}: {item.value}
        </p>
      ))}
      <p className="mt-4 leading-relaxed text-[#6B7280]">{result.interpretation}</p>

      <div className="mt-8 rounded-xl border border-amber-200 bg-[#FFFBEB] p-4 text-sm leading-relaxed text-amber-900">
        This is a self-report screening tool and not a diagnostic instrument. It should not replace
        a clinical interview or professional assessment. If you are concerned about your results, we
        recommend speaking with a qualified mental health professional.
      </div>

      <div className="mt-8 rounded-xl bg-mindora-purple p-6 text-white">
        <p className="text-lg font-semibold">
          Connect with a therapist who specialises in this area
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-4 border-white bg-white text-mindora-purple hover:bg-white/90"
        >
          <Link href={`/therapists?specialisation=${encodeURIComponent(test.category)}`}>
            Find a Therapist
          </Link>
        </Button>
      </div>
    </div>
  );
}
