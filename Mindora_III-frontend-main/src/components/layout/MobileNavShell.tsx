"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { EMERGENCY_HREF, EMERGENCY_NUMBER } from "@/lib/crisis";

interface MobileNavShellProps {
  /** The role's sidebar. Rendered inline on lg+, inside a drawer below lg. */
  sidebar: React.ReactNode;
  /** Show a persistent "Emergency: 112" link in the mobile top bar (patients). */
  showEmergency?: boolean;
  logoHref?: string;
  children: React.ReactNode;
}

export function MobileNavShell({
  sidebar,
  showEmergency = false,
  logoHref,
  children,
}: MobileNavShellProps) {
  const pathname = usePathname();
  // Remember the path the drawer was opened on: navigating elsewhere
  // closes it without needing an effect or per-link callbacks.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white lg:flex-row">
      <header className="flex shrink-0 items-center gap-2 bg-mindora-sidebar px-3 py-2 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpenedAt(pathname)}
          aria-label="Open navigation menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <MindoraLogo variant="light" size="sm" showTagline={false} href={logoHref} />
        </div>
        {showEmergency && (
          <a
            href={EMERGENCY_HREF}
            className="flex h-11 shrink-0 items-center rounded-xl bg-red-600 px-3 text-[13px] font-bold text-white hover:bg-red-700"
          >
            Emergency: {EMERGENCY_NUMBER}
          </a>
        )}
      </header>

      <div className="hidden w-[220px] shrink-0 lg:flex">{sidebar}</div>

      <Dialog open={open} onOpenChange={(o) => setOpenedAt(o ? pathname : null)}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50 lg:hidden" />
          <DialogPrimitive.Popup
            data-slot="mobile-nav-drawer"
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col outline-none lg:hidden"
          >
            <DialogTitle className="sr-only">Navigation menu</DialogTitle>
            <DialogPrimitive.Close
              aria-label="Close navigation menu"
              className="absolute left-full top-2 ml-2 flex h-11 w-11 items-center justify-center rounded-xl bg-mindora-sidebar text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            <div className="flex min-h-0 flex-1 overflow-y-auto bg-mindora-sidebar">{sidebar}</div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
