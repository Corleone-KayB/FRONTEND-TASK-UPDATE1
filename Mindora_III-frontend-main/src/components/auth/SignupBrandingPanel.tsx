import { Check } from "lucide-react";
import { signupFeatures } from "@/lib/content/auth";

export function SignupBrandingPanel() {
  return (
    <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-panel via-[#5b21b6] to-mindora-purple px-12 py-14 text-white lg:flex xl:px-16 xl:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(255,255,255,0.14),transparent_55%)]" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
          Your gentle space begins here
        </p>
        <h1 className="mt-10 max-w-[420px] text-[42px] font-bold leading-[1.15] tracking-tight xl:text-[46px]">
          A calmer mind, one small kindness at a time.
        </h1>
        <p className="mt-5 text-[14px] text-white/65">
          Free to start · No credit card · Cancel anytime.
        </p>
      </div>

      <ul className="relative z-10 space-y-4">
        {signupFeatures.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-[14px] text-white/85">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
