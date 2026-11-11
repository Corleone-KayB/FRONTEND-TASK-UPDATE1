import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in - Mindora",
  description: "Sign in to continue your gentle practice.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
