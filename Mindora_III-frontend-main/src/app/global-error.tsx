"use client";

import { useEffect } from "react";

// Last-resort boundary - only fires if the ROOT layout itself throws, which is
// also the one case where the app's own components/styles might be part of
// what's broken. Deliberately self-contained: no imports from the app, no
// custom design tokens, just plain Tailwind so it can render regardless.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center font-sans">
        <p className="text-lg font-bold text-gray-900">Something went wrong.</p>
        <p className="max-w-sm text-sm text-gray-500">
          Please refresh the page. If this keeps happening, come back a bit later.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
