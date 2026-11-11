import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="ADMIN">
      <div className="flex h-screen overflow-hidden bg-white">
        <AdminSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </RouteGuard>
  );
}
