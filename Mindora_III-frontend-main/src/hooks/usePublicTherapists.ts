import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicTherapists } from "@/lib/public-therapists-api";

// Waits for the session restore (POST /refresh) so a logged-in user never
// briefly sees the mock list.
export function usePublicTherapists() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: ["therapists", "public", isAuthenticated],
    queryFn: () => getPublicTherapists(isAuthenticated),
    enabled: !authLoading,
  });
  return { ...query, isLoading: authLoading || query.isLoading, isAuthenticated };
}
