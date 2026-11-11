export function LoginBrandingPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-panel via-[#5b21b6] to-mindora-purple p-10 text-white lg:flex lg:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />

      <p className="relative z-10 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
        A softer space
      </p>

      <blockquote className="relative z-10 max-w-lg text-4xl font-bold leading-snug tracking-tight lg:text-5xl">
        &ldquo;Take a breath. You already showed up - that&apos;s the hardest part.&rdquo;
      </blockquote>
    </div>
  );
}
