import { BackLink } from "@/components/public/BackLink";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <BackLink fallback="/" className="mb-6" />
      <h1 className="text-4xl font-bold tracking-tight">About Mindora</h1>
      <p className="mt-4 leading-relaxed text-[#6B7280]">
        Mindora is a mental health platform built to help people across Africa find licensed
        therapists, take validated screening tests, and begin care that feels calm, private, and
        human.
      </p>
    </div>
  );
}
