import { RouteGuard } from "@/components/auth/RouteGuard";
import { TherapistSidebar } from "@/components/layout/TherapistSidebar";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="THERAPIST">
      <div className="flex h-screen overflow-hidden bg-white">
        <TherapistSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}
