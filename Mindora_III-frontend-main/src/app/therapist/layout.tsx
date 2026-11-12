import { RouteGuard } from "@/components/auth/RouteGuard";
import { MobileNavShell } from "@/components/layout/MobileNavShell";
import { TherapistSidebar } from "@/components/layout/TherapistSidebar";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="THERAPIST">
      <MobileNavShell sidebar={<TherapistSidebar />}>{children}</MobileNavShell>
    </RouteGuard>
  );
}
