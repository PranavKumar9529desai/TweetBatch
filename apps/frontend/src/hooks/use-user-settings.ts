import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiclient } from "@/lib/api.client";
import { authClient } from "@/lib/auth.client";
import { toast } from "@repo/ui/components/ui/sonner";

const queryKeys = {
  profile: ["user", "profile"] as const,
  session: ["auth", "session"] as const,
};

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiclient.user.profile.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();

      if (!data.success) {
        // @ts-ignore - Type narrowing issue
        throw new Error(data.error || "Failed to fetch user profile");
      }

      return data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; image?: string }) => {
      const response = await apiclient.user.profile.$patch({
        json: updates,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();

      if (!data.success) {
        // @ts-expect-error error type
        throw new Error(data.error || "Failed to update profile");
      }

      return data.user;
    },
    onMutate: async (updates) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.profile });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(queryKeys.profile);

      // Optimistically update
      queryClient.setQueryData(queryKeys.profile, (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousProfile };
    },
    onSuccess: (updatedProfile) => {
      toast.success("Profile updated successfully!");

      // Update profile cache with authoritative data
      queryClient.setQueryData(queryKeys.profile, updatedProfile);

      // Invalidate session to refresh user data everywhere
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
    onError: (error, _, context) => {
      // Rollback to previous value
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.profile, context.previousProfile);
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (params: {
      newPassword: string;
      currentPassword: string;
      revokeOtherSessions?: boolean;
    }) => {
      const { error } = await authClient.changePassword({
        newPassword: params.newPassword,
        currentPassword: params.currentPassword,
        revokeOtherSessions: params.revokeOtherSessions ?? true,
      });

      if (error) {
        throw new Error(error.message || "Failed to change password");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    },
  });
}
