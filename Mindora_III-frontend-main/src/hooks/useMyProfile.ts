import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { fetchMyProfile, updateProfile } from "@/lib/user-api";
import type { UpdateProfileRequest } from "@/types/domain";

// Requires an authenticated session (RouteGuard guarantees one by the time
// anything using this hook renders).
export function useMyProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchMyProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Could not save your profile.";
      toast.error(message);
    },
  });
}
