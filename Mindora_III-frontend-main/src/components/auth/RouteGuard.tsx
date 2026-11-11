"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { dashboardPathForRole } from "@/lib/roles";

// The only page gate in the app. Auth state comes from AuthContext (the
// in-memory access token, restored on load via POST /refresh), so a
// successful login is enough to get in - no cookie has to be readable on
// this host. Every API call is still authorized server-side regardless.

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "PATIENT" | "THERAPIST" | "ADMIN";
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // LoginForm validates returnUrl via safeReturnUrl before using it.
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      router.push(dashboardPathForRole(user.role));
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mindora-purple border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
