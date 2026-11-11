import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MessageCircle, Play, Plus, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RedirectIfAuthenticated } from "@/components/landing/RedirectIfAuthenticated";
import { HOW_IT_WORKS, SPECIALITIES } from "@/lib/mock-data/public";
import { cn } from "@/lib/utils";

const DIVERSE_PEOPLE = "/images/landing/diverse-people.jpg";

const TRUST_AVATARS = [
  { initials: "JM", position: "22% 40%" },
  { initials: "KW", position: "52% 28%" },
  { initials: "AN", position: "78% 42%" },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <RedirectIfAuthenticated />
      <Hero />
      <Specialities />
      <HowItWorks />
      <WhyMindora />
      <HelpWidget />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#F9F6FF]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">
            YOU TALK. WE LISTEN.
          </p>

          <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-border bg-white px-3 py-1.5 shadow-sm">
            <div className="flex -space-x-2">
              {TRUST_AVATARS.map((person) => (
                <AvatarSlot
                  key={person.initials}
                  initials={person.initials}
                  position={person.position}
                />
              ))}
            </div>
            <span className="pr-1 text-xs font-medium text-[#6B7280]">
              Trusted by thousands across Africa
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.15] tracking-tight text-[#1A1A1A] sm:text-5xl">
            Talk with a therapist online, privately, anytime.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#6B7280] sm:text-lg">
            Mindora helps you find licensed care that fits your life. Match in minutes, book a
            session, and speak from a place that feels safe.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-7">
              <Link href="/therapists">
                Explore therapists
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-7">
              <Link href="/get-matched">Get matched</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <Image
              src="/images/landing/hero-session.png"
              alt="A patient meeting a therapist online"
              width={800}
              height={800}
              priority
              className="h-full w-full object-contain"
            />
          </div>

          <div className="absolute -left-2 bottom-6 hidden max-w-[200px] rounded-2xl border border-white/50 bg-white/80 p-4 shadow-lg backdrop-blur-md sm:block">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#6B7280]">
              HOW WE WORK
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Compassionate", "Confidential", "Evidence-based"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F9F6FF] px-2.5 py-1 text-[11px] font-medium text-mindora-purple"
                >
                  {tag === "Confidential" ? <Check className="h-3 w-3" /> : null}
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Specialities() {
  return (
    <section className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#1A1A1A]">
          Licensed therapists for what you are carrying
        </h2>
        <p className="mt-2 text-center text-[#6B7280]">
          Choose a speciality to see people who can help.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALITIES.map((item) => {
            const Icon = item.icon;
            const href =
              item.label === "Others"
                ? "/therapists"
                : `/therapists?specialisation=${encodeURIComponent(item.label)}`;
            return (
              <Link
                key={item.label}
                href={href}
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#F9F6FF] hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center text-mindora-purple">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <span className="font-semibold text-mindora-purple">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-[#F9FAFB] px-4 pb-16 sm:px-6 lg:pb-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#1A1A1A]">
          How it works
        </h2>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md sm:p-10">
          <div className="grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="text-center md:text-left">
                  <Image
                    src={step.image}
                    alt=""
                    width={400}
                    height={400}
                    className="mx-auto mb-5 h-44 w-auto object-contain md:mx-0"
                  />
                  <p className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-mindora-purple md:justify-start">
                    <Icon className="h-4 w-4" />
                    Step {step.step}
                  </p>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyMindora() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-[520px] w-[520px] -translate-x-1/2 text-[#E5E7EB]"
        viewBox="0 0 520 520"
        fill="none"
      >
        <circle cx="260" cy="260" r="120" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="260" cy="260" r="180" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="260" cy="260" r="240" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative mx-auto max-w-6xl">
        <p className="text-right text-sm font-semibold tracking-[0.16em]">
          WHY <span className="text-mindora-purple">MINDORA</span>
        </p>

        <div className="pointer-events-none absolute right-[8%] top-16 hidden lg:block">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6B7280] shadow-sm">
            <Plus className="h-3 w-3" /> Check in
          </span>
        </div>
        <div className="pointer-events-none absolute right-[22%] top-36 hidden lg:block">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6B7280] shadow-sm">
            <Plus className="h-3 w-3" /> See progress
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl bg-[#F5F3FF] p-5 md:row-span-2">
            <Image
              src="/images/landing/phone-checkin.png"
              alt="Mindora daily check-in on a phone"
              width={600}
              height={900}
              className="mx-auto -translate-x-6 h-auto max-h-[520px] w-[130%] max-w-none origin-center object-contain"
            />
            <div className="mt-4">
              <h3 className="font-semibold text-[#1A1A1A]">A quieter daily check-in</h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Thirty seconds to notice how you really feel.
              </p>
            </div>
          </article>

          <article className="flex items-end justify-between rounded-2xl bg-[#F5F3FF] p-6 lg:col-span-2">
            <div>
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">10,000+</p>
              <p className="mt-2 text-sm text-[#6B7280]">People supported on their care journey</p>
              <TrendingUp className="mt-6 h-8 w-8 text-[#1A1A1A]" />
            </div>
            <div className="flex -space-x-3">
              {TRUST_AVATARS.map((person) => (
                <AvatarSlot
                  key={person.initials}
                  initials={person.initials}
                  position={person.position}
                  size="lg"
                />
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-[#F9F6FF] p-6">
            <p className="text-4xl font-bold">
              4.9 <Star className="mb-1 inline h-7 w-7 fill-amber-400 text-amber-400" />
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Average rating from people who booked a first session
            </p>
          </article>

          <article className="relative rounded-2xl bg-[#F5F3FF] p-6">
            <Play className="absolute right-5 top-5 h-8 w-8 rounded-full bg-[#1A1A1A] p-2 text-white" />
            <p className="text-4xl font-bold">96%</p>
            <p className="mt-2 max-w-[200px] text-sm text-[#6B7280]">
              Notice a shift after the first week of care
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function HelpWidget() {
  return (
    <Link
      href="/support"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-mindora-purple px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-mindora-purple-dark"
    >
      <MessageCircle className="h-4 w-4" />
      Need help?
    </Link>
  );
}

function AvatarSlot({
  initials,
  position,
  size = "sm",
}: {
  initials: string;
  position: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "relative inline-flex overflow-hidden rounded-full border-2 border-white bg-mindora-purple-pale",
        size === "lg" ? "h-12 w-12" : "h-7 w-7"
      )}
    >
      <Image
        src={DIVERSE_PEOPLE}
        alt=""
        fill
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <span className="sr-only">{initials}</span>
    </span>
  );
}
