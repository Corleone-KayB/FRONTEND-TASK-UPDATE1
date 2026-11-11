import type { Metadata } from "next";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export const metadata: Metadata = {
  title: "Mindora — Find a therapist",
  description: "Find the right therapist — online, private, and accessible.",
};

export default function PublicPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1A1A1A]">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
