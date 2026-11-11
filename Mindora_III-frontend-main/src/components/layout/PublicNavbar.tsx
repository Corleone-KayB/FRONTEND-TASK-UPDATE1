"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Button } from "@/components/ui/button";
import { PUBLIC_NAV_LINKS } from "@/lib/mock-data/public";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <MindoraLogo href="/" size="sm" showTagline={false} />

        <nav className="hidden items-center gap-8 md:flex">
          {PUBLIC_NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-mindora-purple",
                  active ? "text-mindora-purple" : "text-[#1A1A1A]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-10 px-4 text-sm font-semibold">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="h-10 rounded-xl px-4 text-sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 md:hidden sm:px-6">
        {PUBLIC_NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap text-sm font-medium",
                active ? "text-mindora-purple" : "text-[#6B7280]"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
