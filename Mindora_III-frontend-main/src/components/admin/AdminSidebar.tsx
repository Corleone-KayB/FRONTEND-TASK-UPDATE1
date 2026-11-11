"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { MindoraLogo } from "@/components/brand/MindoraLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/therapist-applications", label: "Therapist Applications", icon: Briefcase },
  { href: "/admin/moderation", label: "Moderation", icon: ListChecks },
  { href: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

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
    <aside className="flex h-full w-[220px] shrink-0 flex-col self-stretch gap-6 bg-mindora-sidebar px-3.5 pb-5 pt-6 text-white shadow-[10px_0_26px_rgba(33,29,44,0.22)]">
      <div className="flex items-center justify-between px-1.5">
        <MindoraLogo variant="light" size="md" />
        <NotificationBell />
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        <p className="mb-1 flex items-center gap-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d6588]">
          <Shield className="h-3 w-3" /> Admin
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-medium transition-shadow",
                isActive
                  ? "font-bold text-white shadow-[inset_5px_5px_11px_#16131e,inset_-5px_-5px_11px_#2c273a]"
                  : "text-[#c6c0d8] hover:text-white hover:shadow-[5px_5px_12px_#171320,-5px_-5px_12px_#2b2638]"
              )}
            >
              <Icon
                className="h-4.5 w-4.5 shrink-0"
                strokeWidth={2.25}
                style={{ color: isActive ? "#a78bfa" : undefined }}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isActive && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#a78bfa]" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2 transition-shadow hover:shadow-[5px_5px_12px_#171320,-5px_-5px_12px_#2b2638]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mindora-sidebar-elevated text-xs font-bold text-[#c4b5fd] shadow-[inset_3px_3px_7px_#16131e,inset_-3px_-3px_7px_#302a41]">
            {user?.email.slice(0, 2).toUpperCase() ?? "AD"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{user?.email ?? "Admin"}</p>
            <p className="text-[11px] text-[#8d84a6]">Administrator</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-[#8d84a6] hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
