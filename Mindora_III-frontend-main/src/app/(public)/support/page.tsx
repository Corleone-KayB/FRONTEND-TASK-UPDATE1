import Link from "next/link";
import { Clock3, Headphones, Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { BackLink } from "@/components/public/BackLink";
import { SupportForm } from "@/components/support/SupportForm";
import { SUPPORT_CONTACT } from "@/lib/mock-data/public";

const HELP_TOPICS = [
  { label: "Account help", topic: "account" },
  { label: "Bookings", topic: "booking" },
  { label: "Billing", topic: "billing" },
  { label: "Technical issue", topic: "technical" },
  { label: "Partnerships", topic: "partnership" },
] as const;

const SUPPORT_STEPS = [
  {
    title: "Pick a channel",
    description: "Call during office hours, email anytime, or send a note below.",
    icon: Headphones,
  },
  {
    title: "Tell us what happened",
    description: "Share a little context so we can help without going back and forth.",
    icon: MessageCircle,
  },
  {
    title: "We follow up",
    description: "Most emails get a reply within 24 hours on business days.",
    icon: Clock3,
  },
] as const;

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#F5F3FF]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#F9F6FF]"
        />

        <div className="relative mx-auto max-w-6xl">
          <BackLink fallback="/" className="mb-6" />
          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">
                WE&apos;RE HERE
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1A1A1A] sm:text-5xl">
                Get help from the Mindora team
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#6B7280] sm:text-lg">
                Questions about your account, a booking, or how Mindora works? Reach us by phone or
                email, or send a message and we&apos;ll get back to you.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {HELP_TOPICS.map((item) => (
                  <Link
                    key={item.topic}
                    href={`/support?topic=${item.topic}#message`}
                    className="rounded-full border border-border bg-white px-3.5 py-2 text-sm font-medium text-mindora-purple shadow-sm transition-all hover:-translate-y-0.5 hover:border-mindora-purple/30 hover:bg-[#F9F6FF]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#6B7280]">
                RESPONSE TIMES
              </p>
              <ul className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-mindora-purple">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Phone</p>
                    <p className="text-sm text-[#6B7280]">{SUPPORT_CONTACT.phoneHours}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F3FF] text-mindora-purple">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Email</p>
                    <p className="text-sm text-[#6B7280]">{SUPPORT_CONTACT.emailNote}</p>
                  </div>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-purple-panel px-4 py-12 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Talk to us directly
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Tap a card to call or open your email app.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={SUPPORT_CONTACT.phoneHref}
              className="group rounded-2xl bg-white/10 p-6 transition-all hover:-translate-y-1 hover:bg-white/15"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-mindora-purple-light transition-transform group-hover:scale-105">
                <Phone className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">Phone</h3>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {SUPPORT_CONTACT.phoneDisplay}
              </p>
              <p className="mt-2 text-sm text-white/70">{SUPPORT_CONTACT.phoneHours}</p>
            </a>

            <a
              href={SUPPORT_CONTACT.emailHref}
              className="group rounded-2xl bg-white/10 p-6 transition-all hover:-translate-y-1 hover:bg-white/15"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-mindora-purple-light transition-transform group-hover:scale-105">
                <Mail className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">Email</h3>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {SUPPORT_CONTACT.email}
              </p>
              <p className="mt-2 text-sm text-white/70">{SUPPORT_CONTACT.emailNote}</p>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] px-4 py-14 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1A1A1A]">
            How support works
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {SUPPORT_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-mindora-purple">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="text-sm font-semibold text-mindora-purple">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1A1A1A]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="message" className="scroll-mt-24 px-4 py-14 sm:px-6 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#6B7280]">WRITE TO US</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1A1A1A]">
              Send a message
            </h2>
            <p className="mt-3 leading-relaxed text-[#6B7280]">
              Tell us what you need. We&apos;ll open your email app so your note goes straight to
              our support inbox at {SUPPORT_CONTACT.email}.
            </p>
            <div className="mt-8 rounded-2xl bg-[#F5F3FF] p-5">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-mindora-purple" />
                <div>
                  <p className="font-semibold text-[#1A1A1A]">In crisis?</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    Support is for product and account help. If you or someone else is in immediate
                    danger, use local emergency services or the crisis line in the Mindora app.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-md sm:p-8">
            <SupportForm key={topic ?? "default"} initialTopic={topic} />
          </div>
        </div>
      </section>
    </div>
  );
}
