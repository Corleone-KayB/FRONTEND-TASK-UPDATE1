import Link from "next/link";
import { CalendarHeart, MessageCircle, PenLine, RefreshCw } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Button } from "@/components/ui/button";
import { RedirectIfAuthenticated } from "@/components/landing/RedirectIfAuthenticated";
import { signupFeatures } from "@/lib/content/auth";

const featureIcons = [RefreshCw, CalendarHeart, PenLine, MessageCircle];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <RedirectIfAuthenticated />
      <header className="flex items-center justify-between px-6 py-5 lg:px-14">
        <MindoraLogo showTagline={false} size="md" />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-panel via-[#5b21b6] to-mindora-purple px-6 py-20 text-white lg:px-14 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
              Care, gently
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
              A calmer mind, one small kindness at a time.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-white/75 lg:text-lg">
              Daily check-ins, real therapists, and a community that holds space for you - all in
              one gentle place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-white px-7 text-base text-mindora-purple-dark hover:bg-white/90"
              >
                <Link href="/signup">Get started free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-white/30 bg-transparent px-7 text-base text-white hover:bg-white/10"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 lg:px-14 lg:py-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {signupFeatures.map((feature, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={feature}
                  className="rounded-2xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mindora-purple-pale text-mindora-purple">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">
                    {feature}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center lg:px-14">
        <p className="text-xs text-muted-foreground">
          24/7 crisis line - always answered.{" "}
          <a href="tel:+250783974068" className="font-semibold text-mindora-purple hover:underline">
            Call +250 783 974 068
          </a>
        </p>
        <p className="mt-3 text-xs text-muted-foreground/70">
          &copy; {new Date().getFullYear()} Mindora. Mindora is not a crisis service.
        </p>
      </footer>
    </div>
  );
}
