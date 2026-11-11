import Link from "next/link";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { FOOTER_LINKS } from "@/lib/mock-data/public";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-[#F9FAFB]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <MindoraLogo href="/" size="sm" showTagline={false} />
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#6B7280] transition-colors hover:text-mindora-purple"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-[#6B7280] sm:px-6">
          © 2026 Mindora Health. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
