import { useQuery } from "@tanstack/react-query";
import { fetchTherapists } from "@/lib/appointments-api";

export function useTherapists(params: { specialisation?: string; language?: string }) {
  return useQuery({
    queryKey: ["therapists", params],
    queryFn: () => fetchTherapists({ ...params, limit: 50 }),
  });
}
