import { AppSidebar } from "@/components/layout/AppSidebar";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="PATIENT">
      <div className="flex h-screen overflow-hidden bg-white">
        <AppSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}
