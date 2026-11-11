import Link from "next/link";
import { Clock, FlaskConical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/public/BackLink";
import { TESTS } from "@/lib/mock-data/tests";

export default function TestsPage() {
  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <BackLink fallback="/" className="mb-4" />
        <p className="text-sm text-[#6B7280]">
          <Link href="/" className="hover:text-mindora-purple">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1A1A1A]">Tests</span>
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Tests</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#6B7280]">
          These tests offer quick answers to help you understand your mental state. They are
          scientifically validated but do not replace expert diagnosis or professional advice.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F9F6FF] px-3 py-1.5 text-xs font-semibold text-mindora-purple">
            <FlaskConical className="h-3.5 w-3.5" />
            Scientific
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F9F6FF] px-3 py-1.5 text-xs font-semibold text-mindora-purple">
            <ShieldCheck className="h-3.5 w-3.5" />
            Trusted
          </span>
        </div>

        {TESTS.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-[#6B7280]">
            No tests are available right now.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTS.map((test) => (
              <article
                key={test.id}
                className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-bold">{test.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#6B7280]">
                  {test.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-mindora-purple">
                  <span>{test.frequency}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {test.durationMinutes} min
                  </span>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/tests/${test.id}`}>Take Test</Link>
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
