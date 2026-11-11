"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, LayoutDashboard, LogOut, Users, Clock, Settings } from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/therapist", label: "Schedule", icon: CalendarClock },
  { href: "/therapist/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/therapist/availability", label: "Availability", icon: Clock },
  { href: "/therapist/patients", label: "Patients", icon: Users },
  { href: "/therapist/settings", label: "Settings", icon: Settings },
];

export function TherapistSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile } = useMyProfile();

  const displayName = profile?.profile?.userName ?? user?.email ?? "Therapist";

  async function handleSignOut() {
    // logout() clears local session state in its own finally block even if the
    // API call fails - always navigate away regardless of that outcome.
    try {
      await logout();
    } catch {
      // Already logged out locally; nothing more to do here.
    }
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col self-stretch bg-mindora-sidebar text-white">
      <div className="flex items-center justify-between px-5 py-5">
        <MindoraLogo variant="light" size="md" />
        <NotificationBell />
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
          Your practice
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mindora-purple text-xs font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{displayName}</p>
            <p className="text-[11px] text-white/45">Therapist</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-white/45 hover:bg-white/5 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
