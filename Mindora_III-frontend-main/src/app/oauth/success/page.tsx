"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathForRole } from "@/lib/roles";

// Landing target for the backend's Google OAuth callback redirect. It sets no
// state itself - AuthProvider's own mount-time bootstrap (POST /refresh, reading
// the refreshToken cookie the callback just set) is what actually establishes the
// session. This page just waits for that to resolve, then routes to the same
// role-based dashboard normal email/password login uses.
export default function OAuthSuccessPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated && user ? dashboardPathForRole(user.role) : "/login");
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-mindora-purple border-t-transparent" />
    </div>
  );
}
