"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-lg font-bold text-foreground">Something went wrong.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        That wasn&apos;t supposed to happen. Try again, or come back in a moment.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
