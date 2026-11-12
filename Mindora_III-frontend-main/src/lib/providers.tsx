"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { CrisisProvider } from "@/contexts/CrisisContext";
import { CrisisOverlay } from "@/components/crisis/CrisisOverlay";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (error instanceof ApiError && error.status === 401) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CrisisProvider>
          {children}
          <CrisisOverlay />
        </CrisisProvider>
        <Toaster position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
