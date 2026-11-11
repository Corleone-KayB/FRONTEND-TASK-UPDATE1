import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  HeartHandshake,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { BackLink } from "@/components/public/BackLink";
import { Button } from "@/components/ui/button";
import { BUSINESS_SEGMENTS, BUSINESS_WHY } from "@/lib/mock-data/public";
import { cn } from "@/lib/utils";

const SEGMENT_ICONS = {
  schools: GraduationCap,
  businesses: Building2,
  ngos: HeartHandshake,
} as const;

export default function BusinessPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-8 h-64 w-64 rounded-full bg-[#F9F6FF]"
        />
        <div className="relative mx-auto max-w-6xl">
          <BackLink fallback="/" className="mb-6" />
          <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">
            FOR ORGANIZATIONS
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#1A1A1A] sm:text-5xl">
            Mental health tools for schools, companies, and community teams
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6B7280] sm:text-lg">
            Mindora partners with institutions across Rwanda to make care accessible — through the
            app, training, and the Inshuti Mindora board game.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-7">
              <Link href="/support">
                Talk to our team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-7">
              <a href="mailto:info@mindora.rw?subject=Business%20partnership">Email partnerships</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Who we work with
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[#6B7280]">
            Pick the path that fits your organization. Each program is built to run without heavy
            clinical infrastructure.
          </p>

          <div className="mt-12 space-y-8">
            {BUSINESS_SEGMENTS.map((segment, index) => {
              const Icon = SEGMENT_ICONS[segment.id as keyof typeof SEGMENT_ICONS];
              const imageFirst = index % 2 === 1;
              return (
                <article
                  key={segment.id}
                  id={segment.id}
                  className="overflow-hidden rounded-2xl border border-[#EDE9FE] bg-white"
                >
                  <div className="grid items-center lg:grid-cols-2">
                    <div
                      className={cn(
                        "relative flex items-center justify-center overflow-hidden bg-[#F5F3FF] px-8 py-12 sm:px-12 sm:py-14",
                        imageFirst && "lg:order-2"
                      )}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -left-10 bottom-6 h-28 w-40 rounded-[40%] bg-[#EDE9FE]"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 bottom-10 h-24 w-32 rounded-[45%] bg-[#DDD6FE]/70"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-8 h-16 w-16 -translate-x-1/2 rounded-full bg-[#EDE9FE]/80"
                      />
                      <Image
                        src={segment.image}
                        alt={segment.imageAlt}
                        width={640}
                        height={640}
                        className="relative z-10 h-auto w-full max-w-[200px] object-contain sm:max-w-[240px]"
                      />
                    </div>
                    <div className={cn("px-6 py-8 sm:px-8 sm:py-10", imageFirst && "lg:order-1")}>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F3FF] text-mindora-purple">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#1A1A1A]">
                        {segment.title}
                      </h3>
                      <p className="mt-3 leading-relaxed text-[#6B7280]">{segment.summary}</p>
                      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {segment.points.map((point) => (
                          <li
                            key={point}
                            className="flex gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm leading-relaxed text-[#1A1A1A]"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-mindora-purple" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">WHY MINDORA</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A1A]">
                Built for Rwanda, ready when distress shows up
              </h2>
              <p className="mt-4 leading-relaxed text-[#6B7280]">
                We build for Rwanda, the app works in Kinyarwanda and English, and everything is
                designed to be accessible. If someone using our app, training, or board game is in
                real distress, that gets flagged and passed on to real help.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {BUSINESS_WHY.map((item, index) => {
                const Icon = index % 2 === 0 ? Languages : ShieldCheck;
                return (
                  <li key={item} className="rounded-2xl border border-border bg-[#F9FAFB] p-5">
                    <Icon className="h-5 w-5 text-mindora-purple" strokeWidth={1.75} />
                    <p className="mt-3 text-sm font-medium leading-relaxed text-[#1A1A1A]">
                      {item}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[#F9FAFB] px-4 py-14 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
              Ready to bring Mindora to your organization?
            </h2>
            <p className="mt-2 text-[#6B7280]">
              Tell us about your school, company, or outreach team and we&apos;ll follow up.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 rounded-xl px-7">
            <Link href="/support">
              Contact support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
