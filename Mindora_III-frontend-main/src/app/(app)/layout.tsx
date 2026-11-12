import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNavShell } from "@/components/layout/MobileNavShell";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="PATIENT">
      <MobileNavShell sidebar={<AppSidebar />} showEmergency logoHref="/today">
        {children}
      </MobileNavShell>
    </RouteGuard>
  );
}
