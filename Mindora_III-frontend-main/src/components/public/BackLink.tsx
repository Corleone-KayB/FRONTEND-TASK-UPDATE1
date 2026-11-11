"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackLink({
  fallback = "/",
  label = "Back",
  className,
  light = false,
}: {
  fallback?: string;
  label?: string;
  className?: string;
  light?: boolean;
}) {
  const router = useRouter();

  function goBack() {
    const referrer = document.referrer;
    const fromThisSite = referrer && referrer.includes(window.location.host);
    if (fromThisSite || window.history.length > 2) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold",
        light ? "text-white hover:text-white/80" : "text-mindora-purple hover:underline",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
