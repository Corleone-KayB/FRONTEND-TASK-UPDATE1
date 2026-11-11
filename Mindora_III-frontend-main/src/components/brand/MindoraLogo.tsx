import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MindoraLogoProps {
  className?: string;
  showTagline?: boolean;
  variant?: "default" | "light";
  href?: string;
  /** Overall lockup scale. Icon diameter ≈ “Mindora” wordmark height (Figma). */
  size?: "md" | "lg" | "sm";
}

const scales = {
  /** Compact lockup - public nav/footer, quiz headers */
  sm: { icon: 32, word: 16, tag: 7, gap: "gap-2" },
  /** Sidebar lockup - icon slightly taller than wordmark */
  md: { icon: 42, word: 20, tag: 9, gap: "gap-2.5" },
  /** Auth pages */
  lg: { icon: 56, word: 28, tag: 11, gap: "gap-3" },
} as const;

export function MindoraLogo({
  className,
  showTagline = true,
  variant = "default",
  href = "/",
  size = "lg",
}: MindoraLogoProps) {
  const isLight = variant === "light";
  const s = scales[size];

  return (
    <Link href={href} className={cn("flex items-center", s.gap, className)}>
      <Image
        src="/images/Mindora_Logo.png"
        alt="Mindora"
        width={s.icon}
        height={s.icon}
        className="shrink-0 self-center object-contain"
        style={{ width: s.icon, height: s.icon }}
        priority
      />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={cn("font-bold tracking-tight", isLight ? "text-white" : "text-foreground")}
          style={{ fontSize: s.word, lineHeight: 1 }}
        >
          Mindora
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1.5 font-medium uppercase tracking-[0.18em]",
              isLight ? "text-white/55" : "text-muted-foreground"
            )}
            style={{ fontSize: s.tag, lineHeight: 1 }}
          >
            Care, gently
          </span>
        ) : null}
      </span>
    </Link>
  );
}
