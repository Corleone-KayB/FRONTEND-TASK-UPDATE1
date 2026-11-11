"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";

// Mounted on the public landing page. Renders nothing - once AuthProvider's
// mount-time session bootstrap resolves, an already-logged-in visitor is sent
// straight to their dashboard instead of seeing the marketing page again.
export function RedirectIfAuthenticated() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, router]);

  return null;
}
