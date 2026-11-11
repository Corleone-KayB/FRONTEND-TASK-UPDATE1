"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Nested inside (app)/layout.tsx, so this only replaces the main content area -
// the sidebar shell stays intact instead of the whole app disappearing.
export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-bold text-foreground">This page hit a snag.</p>
      <p className="max-w-sm text-sm text-muted-foreground">Try again, or head back to Today.</p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/today">Back to Today</Link>
        </Button>
      </div>
    </div>
  );
}
