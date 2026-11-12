import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { MobileNavShell } from "@/components/layout/MobileNavShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="ADMIN">
      <MobileNavShell sidebar={<AdminSidebar />}>{children}</MobileNavShell>
    </RouteGuard>
  );
}
